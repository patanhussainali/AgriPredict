export default function handler(req, res) {
    res.status(200).json({
        message: 'Hello from Vercel Node.js Function!',
        path: req.url,
        method: req.method,
        body: req.body
    });
}
