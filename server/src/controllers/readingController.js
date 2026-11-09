const prisma = require("../config/prisma");

// Allowed glucose reading slots
const ALLOWED_SLOTS = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER"
];

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

// Validate the reading fields
const validateReading = ({ date, slot, value }) => {
  if (!date || !slot || value === undefined || value === null) {
    return "Date, slot and glucose value are required.";
  }

  if (!validateReadingDate(date)) {
    return "Please provide a valid date that is not in the future.";
  }

  if (!ALLOWED_SLOTS.includes(slot)) {
    return "Invalid reading slot.";
  }

  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return "Glucose value must be a whole number between 40 and 600 mg/dL.";
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
        message: "You can add a maximum of four readings per day."
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
        message: "A reading already exists for this slot on this date."
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

    // Handles duplicate requests that reach the database simultaneously
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this slot on this date."
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
        message: "A reading already exists for this slot on this date."
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
        message: "A reading already exists for this slot on this date."
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
  deleteReading
};