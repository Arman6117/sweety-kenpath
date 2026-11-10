
const prisma = require("../config/prisma");

// Allowed glucose reading slots
const ALLOWED_SLOTS = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER"
];

// Convert slot name into a readable label
const getSlotLabel = (slot) => {
  return slot.toLowerCase().replaceAll("_", " ");
};

// Generate duplicate reading error message
const getDuplicateMessage = (slot) => {
  return `You already have an ${getSlotLabel(slot)} reading for this date.`;
};

// Validate date in YYYY-MM-DD format.
// Use India local date for the no-future-date rule.
const validateReadingDate = (dateString) => {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateString
  ) {
    return null;
  }

  const indiaToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  if (dateString > indiaToday) {
    return null;
  }

  return date;
};

// Validate glucose reading fields
const validateReading = ({ date, slot, value }) => {
  if (!date || !slot) {
    return "Date and slot are required.";
  }

  if (value === undefined || value === null || value === "") {
    return "Please enter a glucose value.";
  }

  const readingDate = validateReadingDate(date);

  if (!readingDate) {
    if (
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      const parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
      ) {
        return "Date cannot be in the future.";
      }
    }

    return "Please provide a valid date.";
  }

  if (!ALLOWED_SLOTS.includes(slot)) {
    return "Invalid reading slot.";
  }

  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return "Value must be between 40 and 600 mg/dl.";
  }

  return null;
};

// CREATE READING
const createReading = async (req, res) => {
  try {
    const { date, slot, value } = req.body;

    const validationError = validateReading({ date, slot, value });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const readingDate = validateReadingDate(date);
    const userId = req.user.userId;

    // Check the number of readings for this user on this date
    const dailyCount = await prisma.reading.count({
      where: {
        userId,
        date: readingDate
      }
    });

    if (dailyCount >= 4) {
      return res.status(400).json({
        success: false,
        message: "You can add only 4 readings per day."
      });
    }

    // Check whether this slot already has a reading
    const existingReading = await prisma.reading.findUnique({
      where: {
        userId_date_slot: {
          userId,
          date: readingDate,
          slot
        }
      }
    });

    if (existingReading) {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(slot)
      });
    }

    const reading = await prisma.reading.create({
      data: {
        userId,
        date: readingDate,
        slot,
        value
      }
    });

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully.",
      reading
    });

  } catch (error) {
    console.error("Create reading error:", error);

    // Handle simultaneous duplicate requests
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(req.body.slot)
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create glucose reading."
    });
  }
};

// GET ALL READINGS FOR THE LOGGED-IN USER
const getReadings = async (req, res) => {
  try {
    const readings = await prisma.reading.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ]
    });

    return res.status(200).json({
      success: true,
      count: readings.length,
      readings
    });

  } catch (error) {
    console.error("Get readings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve glucose readings."
    });
  }
};

// GET ONE READING
const getReadingById = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await prisma.reading.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

    return res.status(200).json({
      success: true,
      reading
    });

  } catch (error) {
    console.error("Get reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve glucose reading."
    });
  }
};

// UPDATE READING
const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slot, value } = req.body;

    const validationError = validateReading({ date, slot, value });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const readingDate = validateReadingDate(date);
    const userId = req.user.userId;

    // Confirm that this reading belongs to the logged-in user
    const existingReading = await prisma.reading.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingReading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

    // Check daily limit, excluding the reading being updated
    const dailyCount = await prisma.reading.count({
      where: {
        userId,
        date: readingDate,
        NOT: { id }
      }
    });

    if (dailyCount >= 4) {
      return res.status(400).json({
        success: false,
        message: "You can add only 4 readings per day."
      });
    }

    // Check for another reading occupying the requested slot
    const duplicate = await prisma.reading.findFirst({
      where: {
        userId,
        date: readingDate,
        slot,
        NOT: { id }
      }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(slot)
      });
    }

    const updatedReading = await prisma.reading.update({
      where: { id },
      data: {
        date: readingDate,
        slot,
        value
      }
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading updated successfully.",
      reading: updatedReading
    });

  } catch (error) {
    console.error("Update reading error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(req.body.slot)
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update glucose reading."
    });
  }
};

// DELETE READING
const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reading = await prisma.reading.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

    await prisma.reading.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Glucose reading deleted successfully."
    });

  } catch (error) {
    console.error("Delete reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete glucose reading."
    });
  }
};

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
  validateReading,
  validateReadingDate,
  ALLOWED_SLOTS,
  getSlotLabel,
  getDuplicateMessage
};
