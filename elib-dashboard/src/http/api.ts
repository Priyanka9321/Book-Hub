import { useTokenStore } from "@/store";
import axios from "axios";

const api = axios.create({
  baseURL: "https://book-hub-9qts.onrender.com", // Make sure this matches your backend
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useTokenStore.getState().token; // Always get token from the store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token to the request
  }
  return config;
});

// Login
export const login = async (data: { email: string; password: string }) =>
  api.post("/api/users/login", data);

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  return await api.post("/api/users/register", data);
};

// get books list
export const getBooks = async ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) => {
  if (page < 1 || limit < 1) {
    throw new Error("Page and limit must be positive integers");
  }
  const token = localStorage.getItem("token"); // Get token from localStorage (or other methods)
  try {
    const response = await api.get(`/api/books`, {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${token}`, // Send token in the Authorization header
      },
      timeout: 5000,
    });

    const { books, totalBooks } = response.data;
    if (!Array.isArray(books) || typeof totalBooks !== "number") {
      throw new Error("Invalid data structure received from the API");
    }

    return { books, totalBooks };
  } catch (error: any) {
    console.error("Error fetching books:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch books");
  }
};

// create book
export const createBook = async (data: FormData) => {
  try {
    const response = await api.post("/api/books", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating book:", error);
    throw error;
  }
};

export const getBookById = async (id: string) => {
  try {
    const response = await api.get(`/api/books/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch book details"
    );
  }
};

// Update book by ID
export const updateBook = async (id: string, data: FormData) => {
  if (!id) {
    throw new Error("Book ID is required for update");
  }
  try {
    const response = await api.patch(`/api/books/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update book");
  }
};

// delete book
export const deleteBook = async (bookId: string, token: string) => {
  try {
    const response = await api.delete(`/api/books/${bookId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
};
