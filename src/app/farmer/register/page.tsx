import { redirect } from 'next/navigation';

export default function FarmerRegisterRedirect() {
  redirect('/farmer/signup');
}
