app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong from backend' })
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend server is running on port 3000')
})

