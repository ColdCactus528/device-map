# Device Map

Интерактивное приложение на **React + Leaflet** для отображения устройств на карте.

## 🌐 Демо
Приложение доступно по адресу: [device-map.vercel.app](https://device-map.vercel.app)

## 🚀 Возможности
- React 18 + TypeScript + Vite
- React Leaflet + OpenStreetMap тайлы
- Разные формы и цвета иконок для моделей устройств (`basic`, `advanced`, `special`)
- Popup с информацией об устройстве (имя, модель, статус)
- Дочерние маркеры для устройств, кроме `basic`
- Один маркер перетаскиваемый — новые координаты выводятся в консоль
- Поддержка Docker (сборка + запуск через Nginx)
- Docker Compose для продакшн и разработки (с HMR)

## 📦 Установка и запуск (локально)

Склонировать репозиторий и установить зависимости:
```bash
git clone https://github.com/ColdCactus528/device-map.git
cd device-map
npm install
```

Запуск в режиме разработки:
```
npm run dev
```
После открыть http://localhost:5173

🗺️ Использование

Двойной клик по маркеру → центрирование и увеличение карты.
Перетаскивание выделенного маркера → новые координаты выводятся в консоль.
Данные устройств находятся в src/devices.json

🐳 Docker
```
docker build -t device-map .
docker run --rm -p 8080:80 device-map
```
Приложение будет доступно по адресу http://localhost:8080
