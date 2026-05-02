import React from 'react';
import { Modal } from 'react-native';
import BetModal from './BetModal';
import CreateGroupModal from './CreateGroupModal';
import DistributeModal from './DistributeModal';
import EditBetModal from './EditBetModal';
import EditMenuModal from './EditMenuModal';
import LeaderboardModal from './LeaderboardModal';
import MembersModal from './MembersModal';
import PlaceBetModal from './PlaceBetModal';
import SelectCorrectModal from './SelectCorrectModal';

const GroupScreenModals = (props: any) => {
  const {
    membersModalVisible,
    setMembersModalVisible,
    availableFriends,
    memberData,
    membersLoading,
    renderFriendItem,
    renderMemberItem,
    selectedGroup,
    shouldScrollAvailableFriends,
    shouldScrollMembers,
  } = props;

  return (
    <>
      <DistributeModal {...props} />

      <Modal visible={membersModalVisible} animationType="slide" transparent onRequestClose={() => setMembersModalVisible(false)}>
        <MembersModal
          availableFriends={availableFriends}
          memberData={memberData}
          membersLoading={membersLoading}
          renderFriendItem={renderFriendItem}
          renderMemberItem={renderMemberItem}
          selectedGroupName={selectedGroup?.name}
          setMembersModalVisible={setMembersModalVisible}
          shouldScrollAvailableFriends={shouldScrollAvailableFriends}
          shouldScrollMembers={shouldScrollMembers}
          visible={membersModalVisible}
        />
      </Modal>

      <BetModal {...props} />
      <PlaceBetModal {...props} />
      <EditBetModal {...props} />
      <SelectCorrectModal {...props} />
      <LeaderboardModal {...props} />
      <EditMenuModal {...props} />
      <CreateGroupModal {...props} />
    </>
  );
};

export default GroupScreenModals;
