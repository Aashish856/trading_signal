const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'https://ticker.finology.in/',
  headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
        "Referer": "https://ticker.finology.in/company/ETERNAL",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8,en-IN;q=0.7",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "ASP.NET_SessionId=roamaqitfweaj102nqe2sqnm; _gcl_au=1.1.1267928442.1753377010; _clck=j7cxkm%7C2%7Cfxv%7C0%7C2031; _gid=GA1.2.1181735937.1753377010; _ga=GA1.2.1231859202.1753377010; _clsk=1t01bv8%7C1753377049727%7C4%7C1%7Cq.clarity.ms%2Fcollect; _ga_FDZ59LX88Z=GS2.1.s1753377010$o1$g1$t1753377854$j60$l0$h0"
    }
});

module.exports = apiClient;
