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

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . /app
COPY --from=frontend-builder /frontend/dist /app/static/react/dist

EXPOSE 3000

CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "2", "--timeout", "120", "wsgi:app"]
