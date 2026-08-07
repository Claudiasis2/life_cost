FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY static/react/package.json static/react/package-lock.json ./
RUN npm ci
COPY static/react/ ./
RUN npm run build

FROM python:3.10-alpine

RUN apk add --no-cache \
    gcc \
    musl-dev \
    mariadb-dev \
    linux-headers \
    libffi-dev \
    pkgconfig

WORKDIR /app
COPY . /app
COPY --from=frontend-builder /frontend/dist /app/static/react/dist
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 5000
CMD ["python", "./run.py"]
