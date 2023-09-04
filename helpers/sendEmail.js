const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData); // створюємо екземпляр mailgun
const dotenv = require("dotenv"); // імпортуємо пакет doterv який завантажує змінні середовища з .env

dotenv.config(); // викликаємо метод config який у корні проєкту шукає файл .env і дані з цього файлу додає у змінні оточення (об'єкт process.env) (скорочений варіант імпорту dotenv та виклику методу config - require("dotenv").config(); )

const { MAILGUN_API_KEY } = process.env; // зі змінних оточення забираємо ключ sendgrid

//  створюємо клієнта використовуючи створений екземпляр mailgun
const mg = mailgun.client({
  username: "luchkevich.vitalii@gmail.com", // встановлюємо ім'я користовуча
  key: MAILGUN_API_KEY, //  встановлюємо Api-key
});

const sendEmail = async (data) => {
  const email = {
    ...data,
    from: "Mailgun Sandbox <luchkevich.vitalii@gmail.com>",
  }; // рзпилюємо data та додаємо поле from(від кого лист)
  // викликаємо метод messages.create та відправляємо лист - вказуємо доменне ім'я та параметри листа(визначаються в функції register контроллера authContact.js)
  await mg.messages.create(
    "sandbox44c694a7c62e44c1abb096fbab6df279.mailgun.org",
    { ...email }
  );
  return true;
};

module.exports = sendEmail;
