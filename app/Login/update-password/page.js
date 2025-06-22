'use client';
import UpdatePasswordForm from './UpdatePasswordForm';
import { Suspense } from 'react';

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  );
} 