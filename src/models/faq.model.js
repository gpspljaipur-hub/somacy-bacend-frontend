const prisma = require("../config/prisma");

// ADD FAQ
const addFaq = async (data) => {
  return await prisma.faqs.create({
    data: {
      question: data.question,
      answer: data.answer || null,
      status: data.status !== undefined ? parseInt(data.status) : 2,
    }
  });
};

// GET ALL FAQS
const getAllFaqs = async (limit = 20, offset = 0, search = "") => {
  return await prisma.faqs.findMany({
    where: search ? {
      question: { contains: search, mode: 'insensitive' }
    } : {},
    orderBy: { id: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset)
  });
};

// COUNT FAQS
const countFaqs = async (search = "") => {
  return await prisma.faqs.count({
    where: search ? {
      question: { contains: search, mode: 'insensitive' }
    } : {}
  });
};

// GET FAQ BY ID
const getFaqById = async (id) => {
  return await prisma.faqs.findUnique({
    where: { id: parseInt(id) }
  });
};

// UPDATE FAQ
const updateFaq = async (id, data) => {
  return await prisma.faqs.update({
    where: { id: parseInt(id) },
    data: {
      question: data.question,
      answer: data.answer || null,
      status: data.status !== undefined ? parseInt(data.status) : undefined,
      updated_at: new Date()
    }
  });
};

// DELETE FAQ
const deleteFaq = async (id) => {
  await prisma.faqs.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  addFaq,
  getAllFaqs,
  countFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
