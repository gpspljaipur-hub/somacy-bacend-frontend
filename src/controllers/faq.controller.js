const faqModel = require("../models/faq.model");

// ADD FAQ
const addFaq = async (req, res) => {
  try {
    const { question, answer, status } = req.body;

    if (!question) {
      return res.status(400).json({ status: 0, message: "Question is required" });
    }

    const faq = await faqModel.addFaq({
      question,
      answer,
      status: status !== undefined ? Number(status) : 1,
    });

    res.status(201).json({
      status: 1,
      message: "FAQ added successfully",
      data: faq,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// GET ALL FAQS
const getAllFaqs = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || parseInt(req.query.page) || 1;
    const limit = parseInt(req.body.limit) || parseInt(req.query.limit) || 20;
    const search = req.body.search || req.query.search || "";
    const offset = (page - 1) * limit;

    const data = await faqModel.getAllFaqs(limit, offset, search);
    const total = await faqModel.countFaqs(search);

    res.json({
      status: 1,
      message: "FAQs fetched successfully",
      total_count: total,
      data: data,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// UPDATE FAQ
const updateFaq = async (req, res) => {
  try {
    const { id, question, answer, status } = req.body;

    if (!id) {
      return res.status(400).json({ status: 0, message: "FAQ ID is required" });
    }

    const existing = await faqModel.getFaqById(id);
    if (!existing) {
      return res.status(404).json({ status: 0, message: "FAQ not found" });
    }

    const updated = await faqModel.updateFaq(id, {
      question: question !== undefined ? question : existing.question,
      answer: answer !== undefined ? answer : existing.answer,
      status: status !== undefined ? Number(status) : existing.status,
    });

    res.json({
      status: 1,
      message: "FAQ updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// DELETE FAQ
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ status: 0, message: "FAQ ID is required" });
    }

    const existing = await faqModel.getFaqById(id);
    if (!existing) {
      return res.status(404).json({ status: 0, message: "FAQ not found" });
    }

    await faqModel.deleteFaq(id);
    
    res.json({
      status: 1,
      message: "FAQ deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

module.exports = {
  addFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
};
