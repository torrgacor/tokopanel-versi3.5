// data/config.ts
export interface EggConfig {
  id: number
  nama: string
  harga: number
}

export const pterodactylConfig = { 
  // Private Server Configuration
  private: {
    domain: "https://tokopanel151-private26.panelshop.biz.id",
    apiKey: process.env.PANEL_APIKEY_PRIVATE,
    nests: "5", 
    eggs: [  
      { id: 15, nama: "Nodejs", harga: 0, catatan: "untuk menjalankan Bot WhatsApp dan Telegram  Node.js" },
      { id: 16, nama: "Python", harga: 3000, catatan: "untuk menjalankan Bot Discord dan Telegram Python" }
    ],
    defaultEggId: 15, // ID egg default
    location: "1", 
  },
  // Public Server Configuration
  public: {
    domain: "https://tokopanel151-private26.panelshop.biz.id",
    apiKey: process.env.PANEL_APIKEY_PRIVATE,
    nests: "5", 
    eggs: [  // Changed from 'egg' to 'eggs' (array)
      { id: 15, nama: "Nodejs", harga: 0, catatan: "untuk menjalankan Bot WhatsApp dan Telegram  Node.js" },
      { id: 16, nama: "Python", harga: 3000, catatan: "untuk menjalankan Bot Discord dan Telegram Python" },
      { id: 17, nama: "Nextjs", harga: 10000, catatan: "untuk menjalankan Program Website dan Aplikasi Next.js" }
    ],
    defaultEggId: 15, // ID egg default
    location: "1",
  },
  // Shared settings (not needed if different)
  nestsGame: "2",
  eggSamp: "16",
}

export const appConfig = {
  whatsappGroupLink: "https://youtu.be/LB-X96DJJf4?si=PfPQDnsZRpGounqv", // link
  nameHost: "MTS4YOU XD", // nama host 
  fee: 0.05, // 2%
  garansi: {
    warrantyDays: 30, // Limit hari
    replaceLimit: 5, // Limit replace/claim
  },
  pay: {
    api_key: process.env.SAKURUPIAH_APIKEY,
    api_id: process.env.SAKURUPIAH_ID,
  },
  emailSender: {
    host: "mail.mts4youxd425@gmail.com", // Gmail host
    port: 587, // ga usa di ubah, ga guna 
    secure: false, // false in
    auth: {
      user: "mail.mts4youxd425@gmail.com", // Gmail buat ngirim ke Gmail buyer 
      pass: process.env.GMAIL_PASSWORD, // sandi aplikasi 
    },
    from: "Tukang Panel <mail.mts4youxd425@gmail.com>",
  }, // ganti sendiri 
  telegram: {
    botToken: "8518039874:AAElA2moZRdCC68vZRvy3YPU5b5qdBtANH0",
    ownerId: "7015524549",
    channelId: "@testimonimts4you",
  },
  mongodb: {
    uri: process.env.MONGODB_URL, // url mongo mu
dbName: "Congor",
  },
  socialMedia: {
    whatsapp: "https://wa.me/6289513452028",
    telegram: "https://t.me/mts4youxd",
    tiktok: "https://www.tiktok.com/@mts4you.xd",
    instagram: "https://www.instagram.com/ig_mtsstore",
    channelWa: "https://whatsapp.com/channel/0029VbBHzkt1t90Z4H55f638", // link ch wa
    channelTele: "https://t.me/testimonimts4you", // link ch tele
  }
}
