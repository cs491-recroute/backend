import express from "express";

const router = express.Router();

router.post('/api/saveuser', (req, res) => {
  const { user: { email = '' } = {} } = req.body;
  console.log(email);

  return res.status(200).send('Test');
})

export { router as signupRouter }