const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const dotenv = require("dotenv"); // імпортуємо пакет doterv який завантажує змінні середовища з .env
dotenv.config(); // викликаємо метод config який у корні проєкту шукає файл .env і дані з цього файлу додає у змінні оточення (об'єкт process.env)

const User = require("../models/user"); // імпорт функції моделі

const { ctrlWrapper, HttpError, sendEmail } = require("../helpers"); // імпортуємо функцію генерації та виводу помилки

const { SECRET_KEY, BASE_URL } = process.env;

const avatarDir = path.join(__dirname, "../", "public", "avatars"); // шлях до папки avatars де зберігаються фото аватарок

// реєстрація користувача
const register = async (req, res) => {
  // створюємо кастомне повідомлення - перед створенням нового користувача проводимо перевірку чи існує користувач з таким email та якщо так виводимо кастомне повідомлення
  const { email, password } = req.body; // витягуємо значенния полів email та password з тіла запиту
  const user = await User.findOne({ email }); // шукаємо в базі email вказаний в тілі запиту

  // робимо перевірку, якщо такий email в базі є - виводимо повідомлення про помилку, інакше створюємо нового користовуча
  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10); // хешируеємо пароль, другим аргументом передаємо сіль тобто складність хешируання паролю
  const avatarUrl = gravatar.url(email); // у gravatar викликаємо метод url якому передаємо email користовуча який хоче зареєструватись. Повертається посилання на тимчасову аватарку
  const verificationToken = nanoid(); // створюємо код підтвердження

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarUrl,
    verificationToken,
  }); // зберігаємо в базі хеширований пароль(розпилюємо тіло body та значення поля password замінюємо на результат хеширування паролю ), посилання на тимчасову аватарку та код пыдтвердження

  // створюємо email для підтвердження користовуча
  const verifyEmail = {
    to: email, // кому - email користовуча який зареєструвався
    subject: "Verify email", // тема листа
    text: "Verify your email",
    html: `<html><a target="_blank" href='${BASE_URL}/api/auth/verify/${verificationToken}'>Click to verify email</a></html>`,
  };

  // викликаємо функцію sendEmail - відправляємо листа
  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const verifyEmail = async (req, res) => {
  console.log(req.params);
  const { verificationToken } = req.params;
  // const { verificationToken } = req.params; // витягуємо з req.params значення verificationToken
  const user = await User.findOne({ verificationToken }); // перевіряємо чи є в базі користуач з таким verificationToken

  // робимо перевірку, якщо такий email в базі відсутній - виводимо повідомлення про помилку, інакше створюємо нового користовуча
  if (!user) {
    throw HttpError(404, "User not found");
  }

  // Оновлення користувача за його _id, з встановленням значення verify та ощищення verificationToken(щоб два рази нікто не підтверджував email)
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.status(200).json({
    ResponseBody: {
      message: "Verification successful",
    },
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body; // витягуємо значенния поля email з тіла запиту
  const user = await User.findOne({ email }); // шукаємо в базі email вказаний в тілі запиту

  if (!user) {
    throw HttpError(401, "Email not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email, // кому - email користовуча який зареєструвався
    subject: "Verify email", // тема листа
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationToken}">Click verify email</a>`, // зміст листа - передаємо посилання
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    message: "Verify email send success",
  });
};

// логинізація користовуча
const login = async (req, res) => {
  const { email, password } = req.body; // витягуємо значенния полів email та password з тіла запиту
  const user = await User.findOne({ email }); // шукаємо в базі email вказаний в тілі запиту

  // робимо перевірку, якщо такий email в базі відсутній - виводимо повідомлення про помилку, інакше створюємо нового користовуча
  if (!user) {
    throw HttpError(401, "Email or password is wtrong");
  }

  //  проводимо перевірку - якщо verify=false (тобто користувач не підтвердив електронну адресу) виводимо повідомлення
  if (!user.verify) {
    throw HttpError(401, "Email not verified");
  }

  // перевіряємо(порівнюємо) пароль - перший аргумент пароль з тіла запиту другий аргумент пароль який зберігаеється в базі в захешированому вигляді
  // якщо паролі не співпадають вівидимо повідомлення про помилку, інакше створюємо токен
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wtrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token }); // Оновлення користувача за його _id, з встановленням значення токена

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

// отримання поточного користувача
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

// розлогування користовуча
const logout = async (req, res) => {
  const { _id } = req.user; // отримуємо _id користуача який хоче розлогінитись
  await User.findByIdAndUpdate(_id, { token: "" }); // оновлюємо значення поля токет на пусту строку(видаляємо токен)

  res.status(204).json(); // відправляємо відповідь зі статусом 204 та без вмісту тексту помилки
};

// оновлення підписки
const updateSubscriptionUser = async (req, res) => {
  const { _id } = req.user;
  const { subscription } = req.body;
  const user = await User.findOneAndUpdate(
    { _id },
    { subscription },
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }

  return res.status(200).json({
    message: `Your subscription has been changed to ${subscription}`,
    User_information: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

// оновлення аватарки
const updateAvatar = async (req, res) => {
  const { _id } = req.user; // отримуємо _id користовуча який робить запит
  const { path: tempUpload, originalname } = req.file; // з інформації про файл(req.file) беремо шлях звідки прийшов файл(tempUpload) та його ім'я(originalname)
  console.log(tempUpload);
  console.log(originalname);
  const filename = `${_id}_${originalname}`; // до ім'я файлу аватарки додаємо id
  const resultUpload = path.join(avatarDir, filename); // створюємо новий шлях де повинна зберігатись аватарка

  const avatarSize = await Jimp.read(tempUpload); // читаємо зображення з тимчасового місця зберігання аватарки
  avatarSize.resize(250, 250, Jimp.RESIZE_BEZIER).write(tempUpload); // змінюємо розмір аватарки та перезаписуємо її, замість зображення яке було завантажено від клієнта

  await fs.rename(tempUpload, resultUpload); // переміщуємо файл аватарки з тимчасового місця(tempUpload - папка temp(старий шлях до файлу)), до нової папки - public\avatars(новий шлях до файлу)

  const avatarUrl = path.join("avatars", filename); // створюємо шлях до аватарки
  await User.findOneAndUpdate(_id, { avatarUrl }); // оновлюємо шлях url до аватарки(записуємо у базу)

  res.json({
    avatarUrl,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscriptionUser: ctrlWrapper(updateSubscriptionUser),
  updateAvatar: ctrlWrapper(updateAvatar),
};
