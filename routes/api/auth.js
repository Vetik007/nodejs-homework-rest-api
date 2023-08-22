const express = require("express");
const ctrl = require("../../controllers/authContact"); // Імпорт контролера для обробки роутів, пов'язаних з аутентифікацією

const { validateBody, authentificate } = require("../../middlewares");

// const { authSchemas } = require("../../models/user");

const authSchemas = require("../../shemas/userSchema");

const router = express.Router(); // Створення екземпляру роутера

// Маршрут POST для реєстрації користувача, валідація тіла запиту за схемою реєстрації
// signup
router.post(
  "/register",
  validateBody(authSchemas.registerSchema, "update"),
  ctrl.register
);

// Маршрут POST для входу користувача, валідація тіла запиту за схемою входу
// signin
router.post(
  "/login",
  validateBody(authSchemas.loginSchema, "update"),
  ctrl.login
);

// Маршрут GET для отримання поточного користувача, потрібна аутентифікація
router.get("/current", authentificate, ctrl.getCurrent);

// Маршрут POST для виходу користувача, потрібна аутентифікація
router.post("/logout", authentificate, ctrl.logout);

// Маршрут PATCH для зміни підписки користувача, потрібна аутентифікація та валідація тіла запиту за схемою зміни підписки
router.patch(
  "/subscription",
  authentificate,
  validateBody(authSchemas.updateSubscriptionShema),
  ctrl.updateSubscriptionUser
);

module.exports = router;
