const multer = require("multer");
const path = require("path");

const tempDir = path.join(__dirname, "../", "temp"); // шлях до папки temp

// створюємо об'єкт налаштувань. multer.diskStorage - визначає параметри для зберігання файлів
const multerConfig = multer.diskStorage({
  destination: tempDir, // шлях до тимчасової папки де тимчасово збарігатиметься файл аватарки

  // filename - функція яка визначає як буде формуватись ім'я файлів при збереженні
  /**
   * file - містить інформацію про завантажуваний файл
   * file.originalname - містить орігінальне ім'я файлу, яке зазначено на стороні клієнта
   * cb - функція зворотнього виклку: перший параметр помилка(якщо є) - null означає відсутніть помилки, другий параметр - ім'я файлу під яким він буде збережений на сервері
   */
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: multerConfig, // опція storage визначає як зберігати завантажені файли
});

module.exports = upload;
