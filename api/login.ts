import { NowRequest, NowResponse } from '@now/node';
import { login } from '../util/auth';

export default async function loginHandler(
  req: NowRequest,
  res: NowResponse,
): Promise<void> {
  if (!req.body || !req.body.username || !req.body.password) {
    res.status(400).json({ message: 'Credentials missing!' });
    return;
  }

  const { username, password } = req.body;
  try {
    const token = await login(username, password);
    res.status(200).json({ message: 'Found', token });
  } catch {
    res.status(401).json({ message: 'Invalid credentials!' });
  }
}
