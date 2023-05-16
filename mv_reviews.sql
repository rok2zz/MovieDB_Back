-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 43.201.37.155
-- 생성 시간: 23-03-21 11:52
-- 서버 버전: 8.0.32-0ubuntu0.20.04.2
-- PHP 버전: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 데이터베이스: `testaccount`
--

-- --------------------------------------------------------

--
-- 테이블 구조 `mv_reviews`
--

CREATE TABLE `mv_reviews` (
  `id` bigint NOT NULL,
  `movie_id` bigint NOT NULL,
  `reviewer_id` bigint NOT NULL,
  `rating` int NOT NULL,
  `review` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `writed_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `mv_reviews`
--
ALTER TABLE `mv_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `movie_id` (`movie_id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `rating` (`rating`),
  ADD KEY `wrieted_date` (`writed_date`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `mv_reviews`
--
ALTER TABLE `mv_reviews`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
COMMIT;
