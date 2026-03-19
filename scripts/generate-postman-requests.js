const fs = require('fs');
const path = require('path');

const baseDir = 'postman/collections/Somacy API';

// Ensure directories exist
const dirs = [
  'postman/collections/Somacy API',
  'postman/collections/Somacy API/.resources',
  'postman/collections/Somacy API/Auth',
  'postman/collections/Somacy API/Dashboard',
  'postman/collections/Somacy API/Categories',
  'postman/collections/Somacy API/Banners',
  'postman/collections/Somacy API/Coupons',
  'postman/collections/Somacy API/Brands',
  'postman/collections/Somacy API/Medicines',
  'postman/collections/Somacy API/Delivery Boys',
  'postman/collections/Somacy API/Customers',
  'postman/collections/Somacy API/Medicine Orders',
  'postman/collections/Somacy API/Cart',
  'postman/collections/Somacy API/Testimonials',
  'postman/collections/Somacy API/Settings',
  'postman/collections/Somacy API/Payment Gateways',
  'postman/collections/Somacy API/Lab Tests',
  'postman/collections/Somacy API/Lab Test Categories',
  'postman/collections/Somacy API/Devices',
  'postman/collections/Somacy API/General Items',
  'postman/collections/Somacy API/Export',
  'postman/collections/Somacy API/Users',
  'postman/collections/Somacy API/User Cart',
  'postman/collections/Somacy API/User Orders',
  'postman/environments'
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// Helper to create request YAML
function createRequest(folder, filename, config) {
  const { method, url, order, headers = [], body = null, scripts = [] } = config;
  
  let yaml = `$kind: http-request
method: ${method}
url: '${url}'
order: ${order}`;

  if (headers.length > 0) {
    yaml += `\nheaders:`;
    headers.forEach(h => {
      yaml += `\n  - key: ${h.key}\n    value: '${h.value}'`;
    });
  }

  if (body) {
    if (body.type === 'json') {
      yaml += `\nbody:
  type: json
  content: |-
${body.content.split('\n').map(l => '    ' + l).join('\n')}`;
    } else if (body.type === 'formdata') {
      yaml += `\nbody:
  type: formdata
  content:
${body.content}`;
    }
  }

  if (scripts.length > 0) {
    yaml += `\nscripts:`;
    scripts.forEach(s => {
      yaml += `\n  - type: ${s.type}
    language: text/javascript
    code: |-
${s.code.split('\n').map(l => '      ' + l).join('\n')}`;
    });
  }

  const filePath = path.join(baseDir, folder, `${filename}.request.yaml`);
  fs.writeFileSync(filePath, yaml);
  console.log(`Created: ${filePath}`);
}

// Standard test scripts
const jsonTest = `pm.test("Response is JSON", function () {
  pm.response.to.be.json;
});`;

const status2xxTest = `pm.test("Status code is 2xx", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
});`;

const status2xx4xxTest = `pm.test("Status code is 2xx or 4xx", function () {
  pm.expect(pm.response.code).to.be.within(200, 499);
});`;

const authHeaders = [{ key: 'Authorization', value: 'Bearer {{token}}' }];
const jsonHeaders = [{ key: 'Content-Type', value: 'application/json' }];
const authJsonHeaders = [...authHeaders, ...jsonHeaders];

// Root endpoint
createRequest('', 'Health Check', {
  method: 'GET',
  url: '{{baseUrl}}/',
  order: 1000,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

// Auth endpoints
createRequest('Auth', 'Login', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/login',
  order: 1000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "identifier": "admin@example.com",
  "password": "password123"
}`
  },
  scripts: [{ type: 'afterResponse', code: `${jsonTest}

${status2xx4xxTest}

if (pm.response.code === 200) {
  const res = pm.response.json();
  if (res[0] && res[0].token) {
    pm.environment.set("token", res[0].token);
  }
}` }]
});

createRequest('Auth', 'Signup', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/signup',
  order: 2000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "9876543210",
  "password": "password123",
  "confirm_password": "password123",
  "role": "admin",
  "store_name": "Test Store",
  "store_address": "123 Test St",
  "city": "Test City",
  "state": "Test State",
  "pincode": "123456",
  "drug_license_no": "DL123456",
  "gst_no": "GST123456"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Forgot Password', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/forgot-password',
  order: 3000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "email": "admin@example.com"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Reset Password', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/reset-password',
  order: 4000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "token": "reset_token_here",
  "password": "newpassword123",
  "confirm_password": "newpassword123"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Get Profile', {
  method: 'GET',
  url: '{{baseUrl}}/api/auth/user-profile',
  order: 5000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Update Profile', {
  method: 'PUT',
  url: '{{baseUrl}}/api/auth/update',
  order: 6000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: name
  type: text
  value: Updated Name
- key: mobile
  type: text
  value: '9876543210'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Verify Email Change', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/verify-email-change',
  order: 7000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "token": "verification_token"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Auth', 'Logout', {
  method: 'POST',
  url: '{{baseUrl}}/api/auth/logout',
  order: 8000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Dashboard
createRequest('Dashboard', 'Get Stats', {
  method: 'GET',
  url: '{{baseUrl}}/api/dashboard/stats',
  order: 1000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Categories
createRequest('Categories', 'Get Categories', {
  method: 'POST',
  url: '{{baseUrl}}/api/categories',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Categories', 'Add Category', {
  method: 'POST',
  url: '{{baseUrl}}/api/categories/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: category_name
  type: text
  value: New Category
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Categories', 'Update Category', {
  method: 'PUT',
  url: '{{baseUrl}}/api/categories/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '{{categoryId}}'
- key: category_name
  type: text
  value: Updated Category
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Categories', 'Delete Category', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/categories/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{categoryId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Categories', 'Import Categories', {
  method: 'POST',
  url: '{{baseUrl}}/api/categories/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''
  description: Excel file with categories`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Banners
createRequest('Banners', 'Get Banners', {
  method: 'POST',
  url: '{{baseUrl}}/api/banners',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Banners', 'Add Banner', {
  method: 'POST',
  url: '{{baseUrl}}/api/banners/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: banner_name
  type: text
  value: New Banner
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Banners', 'Update Banner', {
  method: 'PUT',
  url: '{{baseUrl}}/api/banners/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: banner_name
  type: text
  value: Updated Banner
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Banners', 'Delete Banner', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/banners/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Banners', 'Import Banners', {
  method: 'POST',
  url: '{{baseUrl}}/api/banners/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Coupons
createRequest('Coupons', 'Get Coupons', {
  method: 'POST',
  url: '{{baseUrl}}/api/coupons',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Coupons', 'Add Coupon', {
  method: 'POST',
  url: '{{baseUrl}}/api/coupons/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: coupon_code
  type: text
  value: SAVE10
- key: discount_type
  type: text
  value: percentage
- key: discount_value
  type: text
  value: '10'
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Coupons', 'Update Coupon', {
  method: 'PUT',
  url: '{{baseUrl}}/api/coupons/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: coupon_code
  type: text
  value: SAVE20
- key: discount_value
  type: text
  value: '20'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Coupons', 'Delete Coupon', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/coupons/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Coupons', 'Import Coupons', {
  method: 'POST',
  url: '{{baseUrl}}/api/coupons/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Brands
createRequest('Brands', 'Get Brands', {
  method: 'POST',
  url: '{{baseUrl}}/api/brands',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Brands', 'Add Brand', {
  method: 'POST',
  url: '{{baseUrl}}/api/brands/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: brand_name
  type: text
  value: New Brand
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Brands', 'Update Brand', {
  method: 'PUT',
  url: '{{baseUrl}}/api/brands/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: brand_name
  type: text
  value: Updated Brand`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Brands', 'Delete Brand', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/brands/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Brands', 'Import Brands', {
  method: 'POST',
  url: '{{baseUrl}}/api/brands/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Medicines
createRequest('Medicines', 'Get Medicines', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicines',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Medicines', 'Add Medicine', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicines/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: medicine_name
  type: text
  value: Paracetamol 500mg
- key: category_id
  type: text
  value: '1'
- key: brand_id
  type: text
  value: '1'
- key: medicine_description
  type: text
  value: Pain reliever and fever reducer
- key: medicine_type
  type: text
  value: Tablet
- key: price
  type: text
  value: '50'
- key: medicine_discount
  type: text
  value: '5'
- key: stock_status
  type: text
  value: In Stock
- key: stock_quantity
  type: text
  value: '100'
- key: prescription_required
  type: text
  value: 'false'
- key: status
  type: text
  value: '1'
- key: pack_type
  type: text
  value: Strip of 10`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicines', 'Update Medicine', {
  method: 'PUT',
  url: '{{baseUrl}}/api/medicines/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '{{medicineId}}'
- key: medicine_name
  type: text
  value: Updated Medicine
- key: price
  type: text
  value: '60'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicines', 'Delete Medicine', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/medicines/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{medicineId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicines', 'Import Medicines', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicines/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Delivery Boys
createRequest('Delivery Boys', 'Get Delivery Boys', {
  method: 'POST',
  url: '{{baseUrl}}/api/delivery-boys',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Delivery Boys', 'Add Delivery Boy', {
  method: 'POST',
  url: '{{baseUrl}}/api/delivery-boys/add',
  order: 2000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "name": "John Delivery",
  "mobile": "9876543210",
  "email": "delivery@example.com",
  "status": 1
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Delivery Boys', 'Update Delivery Boy', {
  method: 'PUT',
  url: '{{baseUrl}}/api/delivery-boys/update',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1",
  "name": "Updated Name",
  "status": 1
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Delivery Boys', 'Delete Delivery Boy', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/delivery-boys/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Delivery Boys', 'Import Delivery Boys', {
  method: 'POST',
  url: '{{baseUrl}}/api/delivery-boys/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Customers
createRequest('Customers', 'Get Customers', {
  method: 'POST',
  url: '{{baseUrl}}/api/customers',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Customers', 'Add Customer', {
  method: 'POST',
  url: '{{baseUrl}}/api/customers/add',
  order: 2000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "name": "Test Customer",
  "mobile": "9876543210",
  "email": "customer@example.com"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Customers', 'Update Customer', {
  method: 'PUT',
  url: '{{baseUrl}}/api/customers/update',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1",
  "name": "Updated Customer"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Customers', 'Delete Customer', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/customers/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Customers', 'Get Customer Addresses', {
  method: 'GET',
  url: '{{baseUrl}}/api/customers/addresses/:id',
  order: 5000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Customers', 'Import Customers', {
  method: 'POST',
  url: '{{baseUrl}}/api/customers/import',
  order: 6000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Medicine Orders
createRequest('Medicine Orders', 'Get Orders', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicine-orders/list',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Medicine Orders', 'Add Order', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicine-orders/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: customer_id
  type: text
  value: '1'
- key: items
  type: text
  value: '[{"medicine_id": 1, "quantity": 2}]'
- key: delivery_address
  type: text
  value: '123 Test Street'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicine Orders', 'Get Order Details', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicine-orders/preview',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{orderId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicine Orders', 'Update Order', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicine-orders/update',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{orderId}}",
  "status": "processing"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicine Orders', 'Update Payment Status', {
  method: 'POST',
  url: '{{baseUrl}}/api/medicine-orders/update-payment',
  order: 5000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{orderId}}",
  "payment_status": "paid"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Medicine Orders', 'Delete Order', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/medicine-orders/delete',
  order: 6000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "{{orderId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Cart
createRequest('Cart', 'Get Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/cart/list',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Cart', 'Set Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/cart/set',
  order: 2000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}",
  "medicine_id": "1",
  "quantity": 2
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Cart', 'Update Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/cart/update',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}",
  "medicine_id": "1",
  "quantity": 3
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Cart', 'Delete Cart Item', {
  method: 'POST',
  url: '{{baseUrl}}/api/cart/delete-item',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}",
  "medicine_id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Testimonials
createRequest('Testimonials', 'Get Testimonials', {
  method: 'POST',
  url: '{{baseUrl}}/api/testimonials',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Testimonials', 'Add Testimonial', {
  method: 'POST',
  url: '{{baseUrl}}/api/testimonials/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: name
  type: text
  value: John Doe
- key: content
  type: text
  value: Great service!
- key: rating
  type: text
  value: '5'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Testimonials', 'Delete Testimonial', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/testimonials/delete',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Settings
createRequest('Settings', 'Get Settings', {
  method: 'GET',
  url: '{{baseUrl}}/api/settings',
  order: 1000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Settings', 'Update Settings', {
  method: 'PUT',
  url: '{{baseUrl}}/api/settings',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: store_name
  type: text
  value: My Pharmacy
- key: contact_email
  type: text
  value: contact@pharmacy.com
- key: contact_phone
  type: text
  value: '9876543210'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Payment Gateways
createRequest('Payment Gateways', 'Get Payment Gateways', {
  method: 'POST',
  url: '{{baseUrl}}/api/payment-gateways',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Payment Gateways', 'Add Payment Gateway', {
  method: 'POST',
  url: '{{baseUrl}}/api/payment-gateways/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: gateway_name
  type: text
  value: Razorpay
- key: api_key
  type: text
  value: test_key
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Payment Gateways', 'Update Payment Gateway', {
  method: 'PUT',
  url: '{{baseUrl}}/api/payment-gateways/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: gateway_name
  type: text
  value: Updated Gateway`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Payment Gateways', 'Delete Payment Gateway', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/payment-gateways/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Payment Gateways', 'Import Payment Gateways', {
  method: 'POST',
  url: '{{baseUrl}}/api/payment-gateways/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Lab Tests
createRequest('Lab Tests', 'Get Lab Tests', {
  method: 'POST',
  url: '{{baseUrl}}/api/lab-tests',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Lab Tests', 'Add Lab Test', {
  method: 'POST',
  url: '{{baseUrl}}/api/lab-tests/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: test_name
  type: text
  value: Blood Test
- key: price
  type: text
  value: '500'
- key: description
  type: text
  value: Complete blood count
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Lab Tests', 'Update Lab Test', {
  method: 'PUT',
  url: '{{baseUrl}}/api/lab-tests/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: test_name
  type: text
  value: Updated Test
- key: price
  type: text
  value: '600'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Lab Tests', 'Delete Lab Test', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/lab-tests/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Lab Tests', 'Import Lab Tests', {
  method: 'POST',
  url: '{{baseUrl}}/api/lab-tests/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Lab Test Categories
createRequest('Lab Test Categories', 'Get Lab Test Categories', {
  method: 'GET',
  url: '{{baseUrl}}/api/lab-test-categories/list',
  order: 1000,
  headers: authHeaders,
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Lab Test Categories', 'Add Lab Test Category', {
  method: 'POST',
  url: '{{baseUrl}}/api/lab-test-categories/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: category_name
  type: text
  value: Blood Tests
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Devices
createRequest('Devices', 'Get Devices', {
  method: 'POST',
  url: '{{baseUrl}}/api/devices',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('Devices', 'Add Device', {
  method: 'POST',
  url: '{{baseUrl}}/api/devices/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: device_name
  type: text
  value: Blood Pressure Monitor
- key: price
  type: text
  value: '2000'
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Devices', 'Update Device', {
  method: 'PUT',
  url: '{{baseUrl}}/api/devices/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: device_name
  type: text
  value: Updated Device`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Devices', 'Delete Device', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/devices/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Devices', 'Import Devices', {
  method: 'POST',
  url: '{{baseUrl}}/api/devices/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// General Items
createRequest('General Items', 'Get General Items', {
  method: 'POST',
  url: '{{baseUrl}}/api/general_items',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "page": 1,
  "limit": 20,
  "search": ""
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('General Items', 'Add General Item', {
  method: 'POST',
  url: '{{baseUrl}}/api/general_items/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: item_name
  type: text
  value: First Aid Kit
- key: price
  type: text
  value: '500'
- key: status
  type: text
  value: '1'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('General Items', 'Update General Item', {
  method: 'PUT',
  url: '{{baseUrl}}/api/general_items/update',
  order: 3000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: id
  type: text
  value: '1'
- key: item_name
  type: text
  value: Updated Item`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('General Items', 'Delete General Item', {
  method: 'DELETE',
  url: '{{baseUrl}}/api/general_items/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('General Items', 'Import General Items', {
  method: 'POST',
  url: '{{baseUrl}}/api/general_items/import',
  order: 5000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: file
  type: file
  src: ''`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// Export
createRequest('Export', 'Export Data', {
  method: 'POST',
  url: '{{baseUrl}}/api/export',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "type": "medicines",
  "format": "excel"
}`
  },
  scripts: [{ type: 'afterResponse', code: status2xx4xxTest }]
});

// Users (Customer App)
createRequest('Users', 'Register User', {
  method: 'POST',
  url: '{{baseUrl}}/api/users/register',
  order: 1000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "name": "Test User",
  "email": "user@example.com",
  "mobile": "9876543210",
  "password": "password123"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('Users', 'Login User', {
  method: 'POST',
  url: '{{baseUrl}}/api/users/login',
  order: 2000,
  headers: jsonHeaders,
  body: {
    type: 'json',
    content: `{
  "email": "user@example.com",
  "password": "password123"
}`
  },
  scripts: [{ type: 'afterResponse', code: `${jsonTest}

${status2xx4xxTest}

if (pm.response.code === 200) {
  const res = pm.response.json();
  if (res.token) {
    pm.environment.set("token", res.token);
  }
}` }]
});

// User Cart
createRequest('User Cart', 'Get User Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-cart/list',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('User Cart', 'Add to User Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-cart/add',
  order: 2000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}",
  "medicine_id": "1",
  "quantity": 1
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('User Cart', 'Remove from User Cart', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-cart/remove',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}",
  "cart_item_id": "1"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

// User Orders
createRequest('User Orders', 'Get User Orders', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-order/list',
  order: 1000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "user_id": "{{userId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xxTest }]
});

createRequest('User Orders', 'Add User Order', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-order/add',
  order: 2000,
  headers: authHeaders,
  body: {
    type: 'formdata',
    content: `- key: user_id
  type: text
  value: '{{userId}}'
- key: items
  type: text
  value: '[{"medicine_id": 1, "quantity": 2}]'
- key: delivery_address
  type: text
  value: '123 Test Street'`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('User Orders', 'Get User Order Details', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-order/order-details',
  order: 3000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "order_id": "{{orderId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

createRequest('User Orders', 'Delete User Order', {
  method: 'POST',
  url: '{{baseUrl}}/api/user-order/delete',
  order: 4000,
  headers: authJsonHeaders,
  body: {
    type: 'json',
    content: `{
  "order_id": "{{orderId}}"
}`
  },
  scripts: [{ type: 'afterResponse', code: jsonTest + '\n\n' + status2xx4xxTest }]
});

console.log('\n✅ All request files created successfully!');
