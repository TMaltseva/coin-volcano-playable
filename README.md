# Coin Volcano Playable Ad

HTML5 playable ad для казино с выбором сундуков.

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Проект будет доступен по адресу: `http://localhost:3000`

## Сборка для продакшена

```bash
# Сборка проекта
npm run build
```

После сборки будет создана папка `dist` с готовыми файлами для деплоя.

## Деплой

### Вариант 1: Статический хостинг (Netlify, Vercel, GitHub Pages)

1. Соберите проект: `npm run build`
2. Загрузите содержимое папки `dist` на хостинг

**Netlify:**
- Перетащите папку `dist` на [netlify.com/drop](https://app.netlify.com/drop)
- Или подключите GitHub репозиторий и укажите:
  - Build command: `npm run build`
  - Publish directory: `dist`

**Vercel:**
- Установите Vercel CLI: `npm i -g vercel`
- Выполните: `vercel`
- Или подключите через веб-интерфейс [vercel.com](https://vercel.com)

**GitHub Pages:**
- В настройках репозитория включите GitHub Pages
- Укажите source: `dist` folder

### Вариант 2: Обычный веб-хостинг

1. Соберите проект: `npm run build`
2. Загрузите все файлы из папки `dist` на ваш хостинг через FTP/SFTP
3. Убедитесь, что `index.html` находится в корневой директории

### Вариант 3: CDN (для Mintegral/Unity Ads)

1. Соберите проект: `npm run build`
2. Загрузите содержимое `dist` на CDN или S3
3. Укажите URL к `index.html` в настройках рекламной платформы

## Структура проекта

- `index.html` - главная страница
- `game.js` - основная логика игры
- `style.css` - стили
- `assets/` - все ресурсы (изображения, спрайты)
- `dist/` - собранная версия для продакшена (создается после `npm run build`)

## Технологии

- Pixi.js - для рендеринга анимаций
- GSAP - для анимаций
- Vite - сборщик проекта

## Размер бандла

После сборки проверьте размер папки `dist`. Согласно спецификации, общий размер должен быть около 3 MB.

