<template>
  <div>
    <h3>Тест подключения Firebase</h3>
    <a-button @click="testAuth">Тест аутентификации</a-button>
    <a-button @click="testFirestore">Тест Firestore</a-button>
    <p>Статус: {{ status }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { auth, db } from '@/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const status = ref('Не запущено');

const testAuth = async () => {
  try {
    status.value = 'Тестируем аутентификацию...';
    // Пробуем создать тестового пользователя
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      `test${Date.now()}@test.com`, 
      'testpassword'
    );
    status.value = `Аутентификация успешна! User ID: ${userCredential.user.uid}`;
  } catch (error: any) {
    status.value = `Ошибка аутентификации: ${error.message}`;
  }
};

const testFirestore = async () => {
  try {
    status.value = 'Тестируем Firestore...';
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Тестовое сообщение',
      timestamp: new Date()
    });
    status.value = `Firestore успешен! Document ID: ${docRef.id}`;
  } catch (error: any) {
    status.value = `Ошибка Firestore: ${error.message}`;
  }
};
</script>