const SECRET_KEY = "BRAIAN_IURATO_SECURE_2024_APEX";
const encryptData = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = encodeURIComponent(jsonString).split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
        ).join('');
        return btoa(encrypted);
    } catch (e) { return ""; }
};
const decryptData = (cipherText: string | null): any => {
    if (!cipherText) return null;
    try {
        const encrypted = atob(cipherText);
        const jsonString = decodeURIComponent(encrypted.split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
        ).join(''));
        return JSON.parse(jsonString);
    } catch (e) {
        try { return JSON.parse(cipherText || '{}'); } catch (err) { return null; }
    }
};
const data = [{ id: "1", notes: "test 🚀 ñ á é í ó ú" }];
const enc = encryptData(data);
console.log("Encrypted:", enc);
const dec = decryptData(enc);
console.log("Decrypted:", dec);
