# Solana Playground'da Smart Contract Deploy Rehberi

## 1. Solana Playground'a Git
https://playground.solana.com/

## 2. Yeni Proje Oluştur
- "Create a new project" tıklayın
- Proje adı: "solotto"
- Framework: "Anchor"

## 3. Smart Contract Kodunu Kopyala
`programs/solotto-program/src/lib.rs` dosyasındaki kodu kopyalayın ve Playground'a yapıştırın.

## 4. Build Et
- "Build" butonuna tıklayın
- Hata varsa düzeltin

## 5. Deploy Et
- "Deploy" butonuna tıklayın
- Program ID'yi kopyalayın (örn: `9rr8sbt4RYdct4x683zX3f6NuNAPrbha2K48Ymnr93ti`)

## 6. Frontend'i Güncelle
Program ID'yi `src/constants/index.ts` dosyasında güncelleyin:

```typescript
export const PROGRAM_ID = "BURADAN_KOPYALADIGINIZ_PROGRAM_ID";
```

## 7. Smart Contract Entegrasyonunu Aktif Et
`src/services/solanaService.ts` dosyasında buyTicket metodunu gerçek smart contract kullanacak şekilde güncelleyin.

## 8. Test Et
- Cüzdanı bağlayın
- Bilet alın
- Prize pool ve tickets sold'un güncellendiğini görün

## Önemli Notlar:
- Devnet kullandığınızdan emin olun
- Cüzdanınızda devnet SOL olduğundan emin olun
- Program ID'yi doğru kopyaladığınızdan emin olun
