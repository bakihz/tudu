# Tudu

Electron tabanlı görev yönetim uygulaması.

## Kurulum

1. Repoyu klonlayın:

```bash
git clone https://github.com/bakihz/tudu.git
cd tudu
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Environment dosyasını oluşturun:

```bash
cp .env.example .env
```

4. `.env` dosyasındaki ayarları kendi konfigürasyonunuzla güncelleyin:

   - `DB_HOST`: SQL Server sunucu IP'si
   - `DB_USER`: SQL Server kullanıcı adınız
   - `DB_PASS`: SQL Server şifreniz
   - `DB_NAME`: Veritabanı adınız
   - `PORT`: Uygulama portu (varsayılan: 3000)

5. Uygulamayı çalıştırın:

```bash
npm start
```

## Build

Production için build almak:

```bash
npm run dist
```

## Özellikler

- ✅ Görev yönetimi
- ✅ Kullanıcı yetkilendirmesi
- ✅ Admin panel
- ✅ Raporlama sistemi
- ✅ Otomatik güncelleme
- ✅ SQL Server entegrasyonu

## Güvenlik

⚠️ **Önemli**: 
- `.env` dosyası hassas bilgiler içerir ve Git'e dahil edilmemiştir
- `src/utils/db.js` dosyası artık environment variable'ları kullanır
- Loglama sistemi `logs/` klasörüne kayıt tutar (Git'e dahil değil)
- Rate limiting ve güvenlik header'ları aktif
- Şifreler bcrypt ile hashlenmiştir
