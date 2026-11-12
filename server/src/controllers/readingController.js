const prisma = require("../config/prisma");
const {
  ALLOWED_SLOTS,
  isValidUuid,
  getSlotLabel,
  getDuplicateMessage,
  validateReadingDate,
  validateReading,
  isValidDateFilter
} = require("../utils/readingValidation");

/**
 * CREATE READING
 * POST /api/readings
 */
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

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(req.body?.slot || "reading")
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create glucose reading."
    });
  }
};

/**
 * GET ALL READINGS FOR THE LOGGED-IN USER
 * GET /api/readings
 * Supports optional date filtering (?date=YYYY-MM-DD or ?startDate=...&endDate=...)
 * Supports optional pagination (?page=1&limit=20)
 * Sorts by date descending, then slot in natural daily order (MORNING -> AFTER_DINNER)
 */
const getReadings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, startDate, endDate, page, limit } = req.query;

    const where = { userId };

    // Single date filter
    if (date) {
      if (!isValidDateFilter(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format for filter. Expected YYYY-MM-DD."
        });
      }
      where.date = new Date(`${date}T00:00:00.000Z`);
    } else if (startDate || endDate) {
      // Date range filter
      where.date = {};
      if (startDate) {
        if (!isValidDateFilter(startDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate format. Expected YYYY-MM-DD."
          });
        }
        where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        if (!isValidDateFilter(endDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate format. Expected YYYY-MM-DD."
          });
        }
        where.date.lte = new Date(`${endDate}T00:00:00.000Z`);
      }
    }

    // Determine pagination if requested
    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const totalCount = await prisma.reading.count({ where });

    const readings = await prisma.reading.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { slot: "asc" }
      ],
      ...(isPaginated ? { skip: (pageNum - 1) * limitNum, take: limitNum } : {})
    });

    const response = {
      success: true,
      count: readings.length,
      total: totalCount,
      readings
    };

    if (isPaginated) {
      response.page = pageNum;
      response.limit = limitNum;
      response.totalPages = Math.ceil(totalCount / limitNum) || 1;
      response.hasMore = pageNum * limitNum < totalCount;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get readings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve glucose readings."
    });
  }
};

/**
 * GET ONE READING
 * GET /api/readings/:id
 * Strict user data isolation: returns 404 if reading belongs to another user
 */
const getReadingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

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

/**
 * UPDATE READING
 * PUT /api/readings/:id
 * Validates fields, preserves daily limits & slot uniqueness, prevents owner tampering
 */
const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slot, value } = req.body;

    if (!isValidUuid(id)) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

    const validationError = validateReading({ date, slot, value });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const readingDate = validateReadingDate(date);
    const userId = req.user.userId;

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
        message: getDuplicateMessage(req.body?.slot || "reading")
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update glucose reading."
    });
  }
};

/**
 * DELETE READING
 * DELETE /api/readings/:id
 * Strict ownership check: only the owner can delete their reading
 */
const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!isValidUuid(id)) {
      return res.status(404).json({
        success: false,
        message: "Reading not found."
      });
    }

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
  // Re-export for backward compatibility with existing tests
  validateReading,
  validateReadingDate,
  ALLOWED_SLOTS,
  getSlotLabel,
  getDuplicateMessage
};
