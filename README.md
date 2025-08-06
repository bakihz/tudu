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

3. Veritabanı konfigürasyonunu ayarlayın:
```bash
cp src/utils/db.example.js src/utils/db.js
```

4. `src/utils/db.js` dosyasındaki veritabanı bilgilerini kendi ayarlarınızla güncelleyin:
   - `user`: SQL Server kullanıcı adınız
   - `password`: SQL Server şifreniz
   - `server`: SQL Server sunucu IP'si
   - `database`: Veritabanı adınız

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

⚠️ **Önemli**: `src/utils/db.js` dosyası veritabanı giriş bilgilerini içerir ve Git'e dahil edilmemiştir. Bu dosyayı manuel olarak oluşturmanız gerekir.
