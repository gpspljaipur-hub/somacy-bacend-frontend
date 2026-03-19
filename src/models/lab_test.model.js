const prisma = require("../config/prisma");

// ADD LAB TEST
const addLabTest = async (data) => {
  return await prisma.$transaction(async (tx) => {
    const labTest = await tx.lab_tests.create({
      data: {
        category_id: data.lab_category ? parseInt(data.lab_category) : null,
        test_name: data.test_name || null,
        package_name: data.package_name || null,
        amount: data.amount ? parseFloat(data.amount) : 0,
        discount: data.discount ? parseFloat(data.discount) : 0,
        rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : 0,
        is_rghs: data.is_rghs !== undefined ? !!data.is_rghs : false,
        description: data.description || null,
        image: data.image || null,
        lab_test_type: data.lab_test_type || "Singular",
        status: data.status !== undefined ? parseInt(data.status) : 1,
        is_popular: data.is_popular !== undefined ? !!data.is_popular : false,
        lab_partner_name: data.lab_partner_name || null,
        lab_rating: data.lab_rating ? parseFloat(data.lab_rating) : 0,
        lab_accreditation: data.lab_accreditation || null,
        free_home_collection: data.free_home_collection !== undefined ? !!data.free_home_collection : false,
        report_turnaround_time: data.report_turnaround_time || null,
        test_prerequisites: data.test_prerequisites || [],
        parameters_count: data.parameters_count || null,
        included_parameters_details: data.included_parameters_details || null
      }
    });

    if (data.lab_test_type === "Combo" && Array.isArray(data.test_ids) && data.test_ids.length > 0) {
      await tx.lab_test_items.createMany({
        data: data.test_ids.map(testId => ({
          combo_id: labTest.id,
          test_id: parseInt(testId)
        }))
      });
    }

    return await getLabTestById(labTest.id);
  });
};

// GET ALL LAB TESTS
const getAllLabTests = async (limit = 20, offset = 0, search = "", type = null, categoryId = null) => {
  let where = {};
  if (search) {
    where.OR = [
      { test_name: { contains: search, mode: 'insensitive' } },
      { package_name: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (type) where.lab_test_type = type;
  if (categoryId) where.category_id = parseInt(categoryId);

  const tests = await prisma.lab_tests.findMany({
    where,
    include: {
      lab_test_categories: true,
      lab_test_items_lab_test_items_combo_idTolab_tests: {
        include: {
          lab_tests_lab_test_items_test_idTolab_tests: true
        }
      }
    },
    orderBy: { id: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset)
  });

  return tests.map(lt => ({
    ...lt,
    category_name: lt.lab_test_categories ? lt.lab_test_categories.category_name : null,
    included_tests: lt.lab_test_items_lab_test_items_combo_idTolab_tests.map(item => ({
      id: item.lab_tests_lab_test_items_test_idTolab_tests.id,
      test_name: item.lab_tests_lab_test_items_test_idTolab_tests.test_name
    }))
  }));
};

// COUNT LAB TESTS
const countLabTests = async (search = "", type = null, categoryId = null) => {
  let where = {};
  if (search) {
    where.OR = [
      { test_name: { contains: search, mode: 'insensitive' } },
      { package_name: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (type) where.lab_test_type = type;
  if (categoryId) where.category_id = parseInt(categoryId);

  return await prisma.lab_tests.count({ where });
};

// GET LAB TEST BY ID
const getLabTestById = async (id) => {
  const lt = await prisma.lab_tests.findUnique({
    where: { id: parseInt(id) },
    include: {
      lab_test_categories: true,
      lab_test_items_lab_test_items_combo_idTolab_tests: {
        include: {
          lab_tests_lab_test_items_test_idTolab_tests: true
        }
      }
    }
  });

  if (!lt) return null;

  return {
    ...lt,
    category_name: lt.lab_test_categories ? lt.lab_test_categories.category_name : null,
    included_tests: lt.lab_test_items_lab_test_items_combo_idTolab_tests.map(item => ({
      id: item.lab_tests_lab_test_items_test_idTolab_tests.id,
      test_name: item.lab_tests_lab_test_items_test_idTolab_tests.test_name
    }))
  };
};

// UPDATE LAB TEST
const updateLabTest = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    const labTest = await tx.lab_tests.update({
      where: { id: parseInt(id) },
      data: {
        test_name: data.test_name,
        package_name: data.package_name,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        discount: data.discount ? parseFloat(data.discount) : undefined,
        rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : undefined,
        is_rghs: data.is_rghs !== undefined ? !!data.is_rghs : undefined,
        description: data.description,
        image: data.image,
        lab_test_type: data.lab_test_type,
        status: data.status !== undefined ? parseInt(data.status) : undefined,
        is_popular: data.is_popular !== undefined ? !!data.is_popular : undefined,
        lab_partner_name: data.lab_partner_name,
        lab_rating: data.lab_rating ? parseFloat(data.lab_rating) : undefined,
        lab_accreditation: data.lab_accreditation,
        free_home_collection: data.free_home_collection !== undefined ? !!data.free_home_collection : undefined,
        report_turnaround_time: data.report_turnaround_time,
        test_prerequisites: data.test_prerequisites,
        parameters_count: data.parameters_count,
        included_parameters_details: data.included_parameters_details,
        updated_at: new Date()
      }
    });

    if (data.lab_test_type === "Combo" && Array.isArray(data.test_ids)) {
      await tx.lab_test_items.deleteMany({ where: { combo_id: parseInt(id) } });
      if (data.test_ids.length > 0) {
        await tx.lab_test_items.createMany({
          data: data.test_ids.map(testId => ({
            combo_id: parseInt(id),
            test_id: parseInt(testId)
          }))
        });
      }
    } else if (data.lab_test_type === "Singular") {
      await tx.lab_test_items.deleteMany({ where: { combo_id: parseInt(id) } });
    }

    return await getLabTestById(id);
  });
};

// DELETE LAB TEST
const deleteLabTest = async (id) => {
  const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
  await prisma.lab_tests.deleteMany({
    where: { id: { in: ids } }
  });
};

// GET ALL LAB TESTS FOR EXPORT
const getExportData = async () => {
  const tests = await prisma.lab_tests.findMany({
    include: {
      lab_test_items_lab_test_items_combo_idTolab_tests: {
        include: {
          lab_tests_lab_test_items_test_idTolab_tests: true
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  return tests.map(lt => ({
    id: lt.id,
    test_name: lt.test_name,
    package_name: lt.package_name,
    amount: lt.amount,
    discount: lt.discount,
    rghs_discount: lt.rghs_discount,
    is_rghs: lt.is_rghs ? 'Yes' : 'No',
    description: lt.description,
    image: lt.image,
    lab_test_type: lt.lab_test_type,
    status: lt.status,
    created_at: lt.created_at,
    included_tests: lt.lab_test_items_lab_test_items_combo_idTolab_tests.map(item => item.lab_tests_lab_test_items_test_idTolab_tests.test_name).join(', ')
  }));
};

module.exports = {
  addLabTest,
  getAllLabTests,
  countLabTests,
  getLabTestById,
  updateLabTest,
  deleteLabTest,
  getExportData,
};
