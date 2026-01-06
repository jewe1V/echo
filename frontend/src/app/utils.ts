interface AvatarData {
  letter: string;
  color: string;
}

interface User {
  name?: string;
  email?: string;
  id?: string;
}

export function getAvatarData(user: User | string | null | undefined): AvatarData {
  let name: string = '';
  if (!user) {
    name = 'U';
  } else if (typeof user === 'string') {
    name = user.trim();
  } else if (typeof user === 'object' && user !== null) {
    name = user.name?.trim() || user.email?.trim() || user.id?.trim() || '';
  }
  let letter: string;
  if (!name) {
    letter = 'U';
  } else {
    const firstName = name.split(/\s+/)[0];
    letter = firstName.charAt(0).toUpperCase();
    if (!letter.match(/[A-ZА-ЯЁ]/)) {
      letter = 'U';
    }
  }
  const color = getColorByLetter(letter);
  return { letter, color };
}

function getColorByLetter(letter: string): string {
  const colors: string[] = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFD166',
    '#06D6A0',
    '#118AB2',
    '#073B4C',
    '#EF476F',
    '#7209B7',
    '#F15BB5',
    '#00BBF9',
    '#00F5D4',
    '#FF9E00',
    '#9B5DE5',
    '#F72585',
  ];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const letterIndex = alphabet.indexOf(letter.toUpperCase());
  if (letterIndex === -1) {
    return colors[0];
  }
  return colors[letterIndex % colors.length];
}

export function getGradientAvatarData(user: User | string | null | undefined): AvatarData {
  const { letter } = getAvatarData(user);
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