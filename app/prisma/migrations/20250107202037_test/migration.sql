-- AlterTable
ALTER TABLE "_ChannelMembers" ADD CONSTRAINT "_ChannelMembers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ChannelMembers_AB_unique";
