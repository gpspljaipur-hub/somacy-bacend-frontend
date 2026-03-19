const pool = require("../config/db");

// ADD LAB TEST
const addLabTest = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO lab_tests (
        category_id,
        test_name,
        package_name,
        amount,
        discount,
        rghs_discount,
        is_rghs,
        description,
        image,
        lab_test_type,
        status,
        is_popular,
        lab_partner_name,
        lab_rating,
        lab_accreditation,
        free_home_collection,
        report_turnaround_time,
        test_prerequisites,
        parameters_count,
        included_parameters_details
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *;
    `;

    const values = [
      data.lab_category || null,
      data.test_name || null,
      data.package_name || null,
      data.amount || 0,
      data.discount || 0,
      data.rghs_discount || 0,
      data.is_rghs !== undefined ? data.is_rghs : false,
      data.description || null,
      data.image || null,
      data.lab_test_type || "Singular",
      data.status !== undefined ? data.status : 1,
      data.is_popular !== undefined ? data.is_popular : false,
      data.lab_partner_name || null,
      data.lab_rating || 0,
      data.lab_accreditation || null,
      data.free_home_collection !== undefined ? data.free_home_collection : false,
      data.report_turnaround_time || null,
      data.test_prerequisites || [],
      data.parameters_count || null,
      data.included_parameters_details ? JSON.stringify(data.included_parameters_details) : null
    ];

    const result = await client.query(query, values);
    const labTest = result.rows[0];

    // COMBO ITEMS INSERT
    if (
      data.lab_test_type === "Combo" &&
      Array.isArray(data.test_ids) &&
      data.test_ids.length > 0
    ) {
      const itemQuery =
        "INSERT INTO lab_test_items (combo_id, test_id) VALUES ($1,$2)";

      for (const testId of data.test_ids) {
        await client.query(itemQuery, [labTest.id, testId]);
      }
    }

    await client.query("COMMIT");

    return await getLabTestById(labTest.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// GET ALL LAB TESTS
// const getAllLabTests = async (
//   limit = 20,
//   offset = 0,
//   search = "",
//   type = null,
// ) => {
//   let query = `
//         SELECT lt.*,
//         COALESCE(
//             (SELECT json_agg(json_build_object('id', sub.id, 'test_name', sub.test_name))
//              FROM lab_test_items lti
//              JOIN lab_tests sub ON lti.test_id = sub.id
//              WHERE lti.combo_id = lt.id),
//             '[]'::json
//         ) as included_tests
//         FROM lab_tests lt
//     `;
//   const params = [];
//   const conditions = [];

//   if (search) {
//     conditions.push(
//       `(lt.test_name ILIKE $${conditions.length + 1} OR lt.package_name ILIKE $${conditions.length + 1})`,
//     );
//     params.push(`%${search}%`);
//   }

//   if (type) {
//     conditions.push(`lt.lab_test_type = $${conditions.length + 1}`);
//     params.push(type);
//   }

//   if (conditions.length > 0) {
//     query += " WHERE " + conditions.join(" AND ");
//   }

//   query += ` ORDER BY lt.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
//   params.push(limit, offset);

//   const { rows } = await pool.query(query, params);
//   return rows;
// };

const getAllLabTests = async (
  limit = 20,
  offset = 0,
  search = "",
  type = null,
  categoryId = null
) => {
  let query = `
  SELECT 
  lt.*,
  c.category_name,

  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', sub.id,
          'test_name', sub.test_name
        )
      )
      FROM lab_test_items lti
      JOIN lab_tests sub ON lti.test_id = sub.id
      WHERE lti.combo_id = lt.id
    ),
    '[]'::json
  ) as included_tests

  FROM lab_tests lt
  LEFT JOIN lab_test_categories c
  ON lt.category_id = c.id
  `;

  const params = [];
  const conditions = [];

  if (search) {
    conditions.push(
      `(lt.test_name ILIKE $${conditions.length + 1} OR lt.package_name ILIKE $${conditions.length + 1})`,
    );
    params.push(`%${search}%`);
  }

  if (type) {
    conditions.push(`lt.lab_test_type = $${conditions.length + 1}`);
    params.push(type);
  }

  if (categoryId) {
    conditions.push(`lt.category_id = $${conditions.length + 1}`);
    params.push(categoryId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += ` ORDER BY lt.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(limit, offset);

  const { rows } = await pool.query(query, params);

  return rows;
};

// COUNT LAB TESTS
const countLabTests = async (search = "", type = null, categoryId = null) => {
  let query = "SELECT COUNT(*) FROM lab_tests";
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push(
      `(test_name ILIKE $${conditions.length + 1} OR package_name ILIKE $${conditions.length + 1})`,
    );
    params.push(`%${search}%`);
  }

  if (type) {
    conditions.push(`lab_test_type = $${conditions.length + 1}`);
    params.push(type);
  }

  if (categoryId) {
    conditions.push(`category_id = $${conditions.length + 1}`);
    params.push(categoryId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  const { rows } = await pool.query(query, params);
  return parseInt(rows[0].count);
};

// GET LAB TEST BY ID (Including items if combo)
// const getLabTestById = async (id, client = pool) => {
//   const query = `
//         SELECT lt.*,
//         COALESCE(
//             (SELECT json_agg(json_build_object('id', sub.id, 'test_name', sub.test_name))
//              FROM lab_test_items lti
//              JOIN lab_tests sub ON lti.test_id = sub.id
//              WHERE lti.combo_id = lt.id),
//             '[]'::json
//         ) as included_tests
//         FROM lab_tests lt
//         WHERE lt.id = $1
//     `;
//   const { rows } = await client.query(query, [id]);
//   return rows[0];
// };

//rajat
const getLabTestById = async (id, client = pool) => {
  const query = `
SELECT 
  lt.*,
  c.category_name,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', sub.id,
          'test_name', sub.test_name
        )
      )
      FROM lab_test_items lti
      JOIN lab_tests sub ON lti.test_id = sub.id
      WHERE lti.combo_id = lt.id
    ),
    '[]'::json
  ) as included_tests
FROM lab_tests lt
LEFT JOIN public.lab_test_categories c
ON lt.category_id = c.id
WHERE lt.id = $1
`;

  const { rows } = await client.query(query, [id]);

  return rows[0];
};
// UPDATE LAB TEST
const updateLabTest = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
            UPDATE lab_tests
            SET test_name = $1,
                package_name = $2,
                amount = $3,
                discount = $4,
                rghs_discount = $5,
                is_rghs = $6,
                description = $7,
                image = $8,
                lab_test_type = $9,
                status = $10,
                is_popular = $11,
                lab_partner_name = $12,
                lab_rating = $13,
                lab_accreditation = $14,
                free_home_collection = $15,
                report_turnaround_time = $16,
                test_prerequisites = $17,
                parameters_count = $18,
                included_parameters_details = $19,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20
            RETURNING *;
        `;

    const values = [
      data.test_name,
      data.package_name,
      data.amount,
      data.discount,
      data.rghs_discount,
      data.is_rghs,
      data.description,
      data.image,
      data.lab_test_type,
      data.status,
      data.is_popular,
      data.lab_partner_name,
      data.lab_rating,
      data.lab_accreditation,
      data.free_home_collection,
      data.report_turnaround_time,
      data.test_prerequisites,
      data.parameters_count,
      data.included_parameters_details ? JSON.stringify(data.included_parameters_details) : null,
      id,
    ];

    const labTestResult = await client.query(query, values);
    const labTest = labTestResult.rows[0];

    // Sync Combo items if it's a combo
    if (data.lab_test_type === "Combo" && Array.isArray(data.test_ids)) {
      // Remove existing items
      await client.query("DELETE FROM lab_test_items WHERE combo_id = $1", [
        id,
      ]);

      // Add new items
      if (data.test_ids.length > 0) {
        const itemQuery =
          "INSERT INTO lab_test_items (combo_id, test_id) VALUES ($1, $2)";
        for (const testId of data.test_ids) {
          await client.query(itemQuery, [id, testId]);
        }
      }
    } else if (data.lab_test_type === "Singular") {
      // If switched to singular, remove any items
      await client.query("DELETE FROM lab_test_items WHERE combo_id = $1", [
        id,
      ]);
    }

    await client.query("COMMIT");

    // Fetch full data with included tests
    return await getLabTestById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// DELETE LAB TEST (Supports bulk)
const deleteLabTest = async (id) => {
  const ids = Array.isArray(id) ? id : [id];
  await pool.query("DELETE FROM lab_tests WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL LAB TESTS FOR EXPORT
const getExportData = async () => {
  const query = `
        SELECT lt.id, lt.test_name, lt.package_name, lt.amount, lt.discount, lt.rghs_discount, 
               CASE WHEN lt.is_rghs = TRUE THEN 'Yes' ELSE 'No' END as is_rghs,
               lt.description, lt.image, lt.lab_test_type, lt.status, lt.created_at,
               COALESCE(STRING_AGG(sub.test_name, ', '), '') as included_tests
        FROM lab_tests lt
        LEFT JOIN lab_test_items lti ON lt.id = lti.combo_id
        LEFT JOIN lab_tests sub ON lti.test_id = sub.id
        GROUP BY lt.id
        ORDER BY lt.id DESC
    `;
  const { rows } = await pool.query(query);
  return rows;
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
