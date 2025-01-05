FROM node:22.9-alpine AS build

WORKDIR /app/temp
COPY package.json package-lock.json ./
RUN npm ci
COPY . /app/temp
RUN npm run build
RUN npx tailwindcss -i ./assets/tailwind.css -o ./public/main.css

FROM node:22.9-alpine as prod

ENV NODE_ENV=production
ENV HTTP_HOST="0.0.0.0"
ENV HTTP_PORT=3000

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY --from=build /app/temp/dist /app/dist
COPY --from=build /app/temp/public /app/public
COPY --from=build /app/temp/assets /app/assets
COPY --from=build /app/temp/views /app/views

EXPOSE 3000
CMD [ "node", "dist/main.js" ]
