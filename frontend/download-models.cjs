const https = require('https');
const fs = require('fs');
const path = require('path');

const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const destDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading face-api models...');

models.forEach(model => {
    const file = fs.createWriteStream(path.join(destDir, model));
    https.get(`${baseUrl}${model}`, response => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${model}`);
        });
    }).on('error', err => {
        fs.unlink(path.join(destDir, model), () => {});
        console.error(`Error downloading ${model}: ${err.message}`);
    });
});
