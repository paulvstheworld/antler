BEGIN;
CREATE TABLE `user` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `email` varchar(200) NOT NULL,
  `sessionid` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  UNIQUE(`email`)
);

CREATE TABLE `connection` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `user_src_id` integer NOT NULL,
  `user_dest_id` integer NOT NULL,
  `createdAt` datetime,
  `updatedAt` datetime,
  `connected` boolean not null default 0,
  UNIQUE(`user_src_id`, `user_dest_id`)
);
COMMIT;