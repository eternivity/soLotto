# soLotto 🎰

Solana Devnet üzerinde çalışan merkeziyetsiz piyango uygulaması.

## 🚀 Özellikler

- **Cüzdan Bağlantısı**: Phantom ve Solflare cüzdan desteği
- **Sezon Sistemi**: Her sezon 7 gün sürer ve 100 bilet satılır
- **Gerçek Zamanlı Sayaç**: Sezon bitimine kalan süre
- **Bilet Alma**: 0.1 SOL karşılığında bilet satın alma
- **Kazanan Geçmişi**: Önceki sezonların kazananları
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

## 🛠️ Teknolojiler

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js
- **Wallet**: Solana Wallet Adapter
- **Network**: Solana Devnet

## 📦 Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/solotto.git
cd solotto
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

4. Tarayıcınızda `http://localhost:3000` adresini açın.

## 🔗 Program ID

Smart Contract Program ID: `H8EdkWUBqV2VriBg2jQeFSBp2sDMqDM2yHECX7vogWUp`

## 🎯 Kullanım

1. **Cüzdan Bağlama**: Sağ üstteki "Cüzdan Bağla" butonuna tıklayın
2. **Bilet Alma**: "Bilet Al" butonuna tıklayarak 0.1 SOL karşılığında bilet satın alın
3. **Sezon Takibi**: Sol tarafta sezon durumunu ve kalan süreyi takip edin
4. **Kazananları Görme**: Sağ tarafta önceki sezonların kazananlarını görün

## ⚠️ Önemli Notlar

- Bu uygulama **sadece test amaçlıdır** ve Solana Devnet üzerinde çalışır
- Gerçek SOL kullanılmaz, sadece test SOL'ları kullanılır
- Cüzdanınızda Devnet SOL'ları olduğundan emin olun

## 🔧 Geliştirme

### Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── WalletProvider.tsx
│   ├── WalletConnect.tsx
│   ├── SeasonStatus.tsx
│   ├── BuyTicket.tsx
│   ├── Winners.tsx
│   └── Footer.tsx
├── types/              # TypeScript tip tanımları
│   └── index.ts
├── constants/          # Uygulama sabitleri
│   └── index.ts
├── App.tsx            # Ana uygulama bileşeni
└── index.tsx          # Giriş noktası
```

### Smart Contract Entegrasyonu

Şu anda uygulama simüle edilmiş verilerle çalışmaktadır. Gerçek smart contract entegrasyonu için:

1. Anchor programınızı deploy edin
2. `constants/index.ts` dosyasındaki `PROGRAM_ID`'yi güncelleyin
3. `BuyTicket.tsx` bileşeninde gerçek transaction'ları implement edin

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

---

**Not**: Bu proje eğitim amaçlıdır ve gerçek para ile oynanmamalıdır.
