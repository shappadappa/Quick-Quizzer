# Quick Quizzer

## Description

This project is an application that allows users to generate and share their own quizzes. Inspired by Malta's code.sprint competition's Undergrad Task for 2022, the app is able to make use of the MERN stack to achieve a working, performing and user-friendly experience.

## Functionality

The app follows MERN convention by calling requests from backend Expressjs controllers and routes. It is connected to a MongoDB database which follows a certain schema for all collections in the database. In particular, the database has 3 collections:
- Users, who are authenticated using JWT (JSON Web Token), whose data is stored simply using an email, username and an encrypted password. Furthermore, the email and usernames must be unique.
- Quizzes, which contain a variety of different fields in order to allow greater customisation for the user. They allow the user (only one can own a quiz) to have the quiz marked, timed or even password protected, which again makes use of encryption to store it safer in the database.
- Quiz responses, which link together both the users and the quizzes so that the quiz owner can understand where the respondents went wrong, what mark they got and what the average was.

On the frontend, React is used in a number of ways including re-usable components, a number of pages and implementation of React Router to handle the user's navigation. 

## Limitations / Areas for Improvement

- The app is not yet suitable for mobile devices, only for desktops. This is mainly due to the fact that CSS was not really a focus point of this project, which mainly aimed at understanding and applying the MERN stack.
- The quiz share codes (MongoDB IDs stored in the database) are a bit long compared to other quiz sites such as Quizizz, which may be a bit more difficult to remember or share with others.
- The app could allow greater customisation such as with user profile pictures, specific colours used for quizzes, themed quizzes and grouping the questions together in different sections.
