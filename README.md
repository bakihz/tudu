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

## Android ile Çalıştırma

Android uygulamasını derlemek ve çalıştırmak için aşağıdaki adımları izleyin:

1. Web uygulamasını üretin (build):

   ```bash
   npm run build
   ```

2. Üretilen dosyaları Android projesine kopyalayın:

   ```bash
   npm run android:copy
   ```

3. Android projesini Android Studio'da açın:

   ```bash
   npm run android:open
   ```

4. Android Studio üzerinden bir emülatör veya gerçek cihaz seçip uygulamayı çalıştırın (Run > Run 'app').

Alternatif olarak, terminalden doğrudan çalıştırmak için:

   ```bash
   npx cap run android
   ```

> Not: İlk defa çalıştırıyorsanız veya hata alırsanız, Android Studio'da projeyi "Sync Project with Gradle Files" ile senkronize edin ve eksik SDK/araçları yükleyin.
