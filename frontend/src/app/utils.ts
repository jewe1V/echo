interface AvatarData {
  letter: string;
  color: string;
}

interface User {
  name?: string;
  email?: string;
  id?: string;
}

/**
 * Функция для получения первой буквы имени пользователя и цвета для аватарки
 * @param user - Объект пользователя (может содержать name, email или id)
 * @returns Объект с буквой и цветом
 */
export function getAvatarData(user: User | string | null | undefined): AvatarData {
  // Если передана строка, считаем её именем
  let name: string = '';
  
  if (!user) {
    name = 'U'; // Default for null/undefined
  } else if (typeof user === 'string') {
    name = user.trim();
  } else if (typeof user === 'object' && user !== null) {
    // Сначала пытаемся получить из name, потом из email, потом из id
    name = user.name?.trim() || user.email?.trim() || user.id?.trim() || '';
  }
  
  // Получаем первую букву (заглавную)
  let letter: string;
  
  if (!name) {
    letter = 'U'; // Anonymous user
  } else {
    // Берем первую букву первого слова (имени)
    const firstName = name.split(/\s+/)[0];
    letter = firstName.charAt(0).toUpperCase();
    
    // Если буква не латинская и не кириллическая, используем 'U'
    if (!letter.match(/[A-ZА-ЯЁ]/)) {
      letter = 'U';
    }
  }
  
  // Получаем цвет на основе буквы
  const color = getColorByLetter(letter);
  
  return { letter, color };
}

/**
 * Функция для получения цвета на основе буквы
 * Можно использовать различные алгоритмы для распределения цветов
 */
function getColorByLetter(letter: string): string {
  // Список красивых цветов для аватарок (можно изменить по вкусу)
  const colors: string[] = [
    '#FF6B6B', // Красный
    '#4ECDC4', // Бирюзовый
    '#FFD166', // Желтый
    '#06D6A0', // Зеленый
    '#118AB2', // Синий
    '#073B4C', // Темно-синий
    '#EF476F', // Розовый
    '#7209B7', // Фиолетовый
    '#F15BB5', // Ярко-розовый
    '#00BBF9', // Голубой
    '#00F5D4', // Бирюзовый светлый
    '#FF9E00', // Оранжевый
    '#9B5DE5', // Пурпурный
    '#F72585', // Фуксия
  ];
  
  // Привязываем буквы к цветам по алфавиту
  // Для латинского алфавита A-Z и кириллического А-Я
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const letterIndex = alphabet.indexOf(letter.toUpperCase());
  
  if (letterIndex === -1) {
    // Если буква не найдена в алфавите, возвращаем цвет по умолчанию
    return colors[0];
  }
  
  // Используем остаток от деления для циклического выбора цвета
  return colors[letterIndex % colors.length];
}

// Альтернативный вариант: функция для градиентной аватарки
export function getGradientAvatarData(user: User | string | null | undefined): AvatarData {
  const { letter } = getAvatarData(user);
  
  // Градиенты для аватарок
  const gradients: string[] = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  ];
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const letterIndex = alphabet.indexOf(letter.toUpperCase());
  
  const color = letterIndex === -1 ? gradients[0] : gradients[letterIndex % gradients.length];
  
  return { letter, color };
}