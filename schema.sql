BEGIN;
CREATE TABLE `user` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `email` varchar(200) NOT NULL,
  `sessionid` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  UNIQUE(`email`)
);

CREATE TABLE `connection` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `user_src_id` integer NOT NULL,
  `user_dest_id` integer NOT NULL,
  `emailed` boolean NOT NULL DEFAULT 0,
  `createdAt` datetime,
  `updatedAt` datetime,
  `connected` boolean DEFAULT NULL,
  UNIQUE(`user_src_id`, `user_dest_id`)
);
COMMIT;