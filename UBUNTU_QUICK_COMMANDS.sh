#!/bin/bash

# 🐧 Ubuntu Terminal ile Solana Program Deploy - Hızlı Komutlar

echo "🚀 Ubuntu'da Solana Program Deploy Başlıyor..."

# 1. Rust Kurulumu
echo "📦 Rust kuruluyor..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
rustup component add rust-src

# 2. Solana CLI Kurulumu
echo "📦 Solana CLI kuruluyor..."
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Anchor Kurulumu
echo "📦 Anchor kuruluyor..."
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 4. Node.js Kurulumu
echo "📦 Node.js kuruluyor..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
nvm use node

# 5. Proje Klasörüne Geç
echo "📁 Proje klasörüne geçiliyor..."
cd ~/Desktop/solotto-program

# 6. Devnet'e Geç
echo "🌐 Devnet'e geçiliyor..."
solana config set --url devnet

# 7. Cüzdan Oluştur (Eğer yoksa)
echo "💰 Cüzdan kontrol ediliyor..."
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🆕 Yeni cüzdan oluşturuluyor..."
    solana-keygen new
fi

# 8. Devnet SOL Al
echo "💸 Devnet SOL alınıyor..."
solana airdrop 2

# 9. Programı Build Et
echo "🔨 Program build ediliyor..."
anchor build

# 10. Program ID'yi Al
echo "🆔 Program ID alınıyor..."
PROGRAM_ID=$(solana address -k target/deploy/solotto_program-keypair.json)
echo "✅ Program ID: $PROGRAM_ID"

# 11. Anchor.toml Dosyasını Güncelle
echo "📝 Anchor.toml güncelleniyor..."
cat > Anchor.toml << EOF
[toolchain]
package_manager = "yarn"

[features]
resolution = true
skip-lint = false

[programs.devnet]
solotto_program = "$PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
EOF

# 12. Programı Deploy Et
echo "🚀 Program deploy ediliyor..."
anchor deploy

# 13. Frontend'e Program ID'yi Ekle
echo "🔗 Frontend'e Program ID ekleniyor..."
cd ../solotto
sed -i "s/YOUR_ACTUAL_PROGRAM_ID/$PROGRAM_ID/g" src/constants/index.ts

echo "🎉 Deploy tamamlandı!"
echo "📋 Program ID: $PROGRAM_ID"
echo "🌐 Solana Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "🚀 Frontend başlatmak için: npm start"






