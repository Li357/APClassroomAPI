import { NowRequest, NowResponse } from '@now/node';
import { login } from '../util/auth';

export default async function loginHandler(
  req: NowRequest,
  res: NowResponse,
): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Credentials missing!' });
    return;
  }

  try {
    const token = await login(username, password);
    res.status(200).json({ message: 'Found', token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}
