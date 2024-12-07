export interface Author {
    _id: string;
    name: string;
}

export interface Book {
    Book: any;
    _id: string;
    title: string;
    description: string;
    genre: string;
    author: Author;
    coverImage: string;
    file: string;
    createdAt: string;
    creatorId: string; // Add this property to match the usage in your code
}