const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// ─── Ensure all upload directories exist on startup ───────────────────────────
const UPLOAD_DIRS = [
  "src/uploads",
  "src/uploads/banners",
  "src/uploads/brands",
  "src/uploads/categories",
  "src/uploads/coupons",
  "src/uploads/medicines",
  "src/uploads/lab_tests",
  "src/uploads/lab_test_categories",
  "src/uploads/doctors",
  "src/uploads/blogs",
  "src/uploads/devices",
  "src/uploads/general_items",
  "src/uploads/payment_gateways",
  "src/uploads/prescriptions",
  "src/uploads/testimonials",
  "src/uploads/orders",
];

UPLOAD_DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created upload dir: ${dir}`);
  }
});
// ──────────────────────────────────────────────────────────────────────────────

const app = express();
const categoryRoutes = require("./routes/category.routes");
const bannerRoutes = require("./routes/banner.routes");
const couponRoutes = require("./routes/coupon.routes");
const brandRoutes = require("./routes/brand.routes");
const medicineRoutes = require("./routes/medicine.routes");
const deliveryBoyRoutes = require("./routes/delivery_boy.routes");
const paymentGatewayRoutes = require("./routes/payment_gateway.routes");
const customerRoutes = require("./routes/customer.routes");
const medicineOrderRoutes = require("./routes/medicine_order.routes");
const generalItemRoutes = require("./routes/general_item.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const labTestCategoryRoutes = require("./routes/lab_test_category.routes");
const cartRoutes = require("./routes/userCart.routes");
const userOrderDetails = require("./routes/userOrder.routes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("src/uploads"));

const dashboardRoutes = require("./routes/dashboard.routes");

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Somacy backend running 🚀" });
});

app.use("/api/dashboard", dashboardRoutes);

const faqRoutes = require("./routes/faq.routes");

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/delivery-boys", deliveryBoyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/medicine-orders", medicineOrderRoutes);
app.use("/api/orders", medicineOrderRoutes); // Generic alias
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/testimonials", require("./routes/testimonial.routes"));
app.use("/api/settings", require("./routes/settings.routes"));
app.use("/api/payment-gateways", paymentGatewayRoutes);
app.use("/api/lab-tests", require("./routes/lab_test.routes"));
app.use("/api/devices", require("./routes/device.routes"));
app.use("/api/general_items", require("./routes/general_item.routes"));
app.use("/api/export", require("./routes/export.routes"));
app.use("/api/users", userRoutes);
app.use("/api/lab-test-categories", labTestCategoryRoutes);
app.use("/api/user-cart", cartRoutes);
app.use("/api/user-order", userOrderDetails);
app.use("/api/faqs", faqRoutes);
app.use("/api/blogs", require("./routes/blog.routes"));
app.use("/api/doctors", require("./routes/doctor.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
module.exports = app;
