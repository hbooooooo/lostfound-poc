# 🔧 Post-Replication Setup Guide for Lost & Found App

This guide lists all steps and commands required after cloning or replicating the repository on a new environment.

---

## 1. 🐳 Docker-Based App Initialization

```bash
# Clone repository
git clone <repo_url>
cd lostfound-poc

# Optional: Adjust .env file with local/staging credentials
cp .env.example .env
nano .env

# Launch services
docker-compose up --build -d

# Initialize database (if needed)
docker exec -i lostfound-pg psql -U postgres -d lostfound < backend/db/init.sql
```

---

## 2. 🌐 Subdomain & DNS Setup (Optional)

Set the following A record on your domain DNS:

```
lost.yourdomain.com. 10800 IN A <your_public_IP>
```

---

## 3. 🔐 HTTPS via Nginx + Let's Encrypt (on host)

### Install Nginx and Certbot
```bash
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y
```

### Add Nginx reverse proxy config:
```nginx
# /etc/nginx/sites-available/lost
server {
    listen 80;
    server_name lost.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site and reload:
```bash
sudo ln -s /etc/nginx/sites-available/lost /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Enable HTTPS:
```bash
sudo certbot --nginx -d lost.yourdomain.com
```

---

## 4. 📦 Stripe & API Credentials

Update `.env` with environment-specific keys:
```
STRIPE_SECRET_KEY=sk_test_...
EMAIL_SERVICE_API_KEY=...
SHIPPING_API_KEY=...
```

---

## 5. 📬 Mail Testing (Optional for Dev)

Use Mailpit or Maildev for local email testing:
```bash
docker run -d -p 1080:1080 -p 1025:1025 mailpit/mailpit
```

---

## 6. 🗃 Optional Data Restore

```bash
# If restoring from backup
cat backup.sql | docker exec -i lostfound-pg psql -U postgres -d lostfound
```

---

## 7. 🧪 Post Setup Check

- Visit: `https://lost.yourdomain.com`
- API: `https://lost.yourdomain.com/api/health`
- Stripe Test Payment: simulate flow using Stripe CLI or webhooks
- Claim Link Email: verify guest flow end-to-end

---

## ✅ Done!
Your cloned environment is now configured and running. Remember to document changes in `.env` or add host-specific notes.