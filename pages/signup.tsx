"use client"
import React, { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth"
import { auth } from "@/firebase/config"
import { useRouter } from 'next/navigation';
import { getDatabase, ref, set } from "firebase/database";
import {v4 as userIddb} from "uuid";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();

  interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
  }

  const [CreateUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    console.log('Sign up form submitted:', formData);
    if (!formData.email || !formData.password || formData.password !== formData.confirmPassword) {
      alert("Please make sure all fields are valid.");
      return;
    }

    try {
      const result = await CreateUserWithEmailAndPassword(formData.email, formData.password);
      createUser(formData.email);
      createRoom(formData.email);

      console.log("result", result);
      localStorage.setItem('user', "loggedIn");
      // if (result){
      router.push('/');
      // }
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error", error.message);
      } else {
        console.error("An unknown error occurred");
      }
    }

  };

  const sanitizeEmail = (email: string) => {
    return email.replace(/[.#$/[\]]/g, '_');
  };
  

  const createUser = async (email: string)=> {
    const db = getDatabase();
    await set(ref(db, 'users/' + sanitizeEmail(email)), {
      id: email,
      email: email,
    });
  }
  const createRoom = async (email: string)=> {
    const db = getDatabase();
    await set(ref(db, 'rooms/' + sanitizeEmail(email)), {
      id: email,
      email: email,
      data : {"data": "data"},
      admin : true,
      members : [email]
    });
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          KanBan
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Create an account
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Your email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="name@company.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full text-black bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                Create an account
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Already have an account? <a href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Login here</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpForm;