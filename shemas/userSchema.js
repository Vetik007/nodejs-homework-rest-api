const Joi = require("joi");

// створюємо об'єкт Joi, тобто вказуємо вимоги до об'єкту(як propTypes), за допомогою якого первіряємо тіло body

const registerSchema = Joi.object({
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  subscription: Joi.string(),
});


const emailSchema = Joi.object({
  email: Joi.string().email().required(),
  
});

const loginSchema = Joi.object({
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  subscription: Joi.string(),
  token: Joi.string().required,
});

const updateSubscriptionShema = Joi.object({
  subscription: Joi.string().valid("starter", "pro", "business").required(),
});

module.exports = {
  registerSchema,
  emailSchema,
  loginSchema,
  updateSubscriptionShema,
};
