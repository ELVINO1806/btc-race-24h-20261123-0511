# btc-race-24h-20261123-0511

[![make.fun competition](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![make.fun rank](https://make.fun/badge/btc-race-24h-20261123-0511/ELVINO1806/btc-race-24h-20261123-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![make.fun reward](https://make.fun/badge/btc-race-24h-20261123-0511/ELVINO1806/btc-race-24h-20261123-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)

Bot trading cbBTC/USDC bar 1 menit untuk lomba make.fun "Race a BTC trading bot live for 24 hours". Long only, modal kertas $1.000.

## Strategi

Dip-entry vs SMA120. Masuk saat close < 99,2% SMA120, modal penuh. Keluar TP +2% / SL -2% dari harga entry. Re-entry diizinkan setelah keluar posisi.

Logika di baliknya: beli saat harga turun di bawah rata-rata 120 bar terakhir, lalu jual saat pantulan +2% tercapai atau potong kerugian di -2%. Aturan keluar yang simetris menjaga risiko per trade tetap kecil, dan bot hanya memegang satu posisi penuh dalam satu waktu — tidak ada leverage, tidak ada short.

## Hasil grade-local (dev window 24 jam)

- PnL: +$18,38
- Trade: 2
- Max drawdown: ~0,23%

Bot lolos gate di jendela naik maupun turun pada replay lokal, karena aturan entry yang sama bekerja di kedua arah pasar: di jendela naik, dip-entry menangkap pantulan; di jendela turun, stop-loss membatasi kerugian per trade.

## Menjalankan

```bash
node main.ts
```

Node 22, stdlib saja, tanpa dependensi eksternal.
