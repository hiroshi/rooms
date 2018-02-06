require 'rails_helper'

RSpec.describe Message, type: :model do
  let(:room) { Room.create! }
  let(:user) { User.create! }

  describe 'tags' do
    it do
      message = Message.create!(room: room, user: user, content: '#日本語 #todo #hoge #fuga')
      expect(message.meta['tags']).to match(array_including('日本語', 'todo'))
    end
  end

  describe 'scope :query' do
    describe 'query("todo")' do
      let(:subject) { Message.query('todo') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create!(room: room, user: user) }
        it { is_expected.not_to exist }
      end
    end

    describe 'query("!todo")' do
      let(:subject) { Message.query('!todo') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo') }
        it { is_expected.not_to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create!(room: room, user: user) }
        it { is_expected.to exist }
      end
    end

    describe 'query("todo !done")' do
      let(:subject) { Message.query('todo !done') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: %w[todo done]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo #done') }
        it { is_expected.not_to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create!(room: room, user: user) }
        it { is_expected.not_to exist }
      end
    end

    describe 'query("todo !done !hidden")' do
      let(:subject) { Message.query('todo !done !hidden') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: %w[todo done]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo #done') }
        it { is_expected.not_to exist }
      end

      context 'tags: %w[todo hidden]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo #hidden') }
        it { is_expected.not_to exist }
      end

      context 'tags: %w[todo hidden done]' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo #hidden #done') }
        it { is_expected.not_to exist }
      end
    end

    describe 'query("/p:parent")' do
      let(:parent) { Message.create!(room: room, user: user) }
      let(:subject) { Message.query("/p#{parent.id}") }

      context 'there is a child of parent message' do
        let!(:child) do
          message = Message.create!(room: room, user: user, content: '#todo')
          message.ancestor_relationships.create!(parent: parent, order: 0)
        end
        it { is_expected.to exist }
      end

      context 'there is a message but a child of parent' do
        let!(:message) { Message.create!(room: room, user: user, content: '#todo') }

        it { is_expected.not_to exist }
      end
    end

    describe 'query("-id")' do
      let!(:first) { Message.create!(room: room, user: user, content: 'first') }
      let!(:second) { Message.create!(room: room, user: user, content: 'second') }
      subject { Message.query('-id').map(&:id) }

      it do
        is_expected.to eq([first, second].map(&:id))
      end
    end

    describe 'query("created_at>-12h")' do
      let!(:first) { Message.create!(room: room, user: user, content: 'first', created_at: 13.hours.ago) }
      let!(:second) { Message.create!(room: room, user: user, content: 'second') }
      subject { Message.query('created_at>-12h').map(&:id) }

      it do
        is_expected.to eq([second].map(&:id))
      end
    end
  end

  describe 'ancestors' do
    it do
      parent = Message.create!(room: room, user: user)
      child = Message.create!(room: room, user: user)
      child.ancestor_relationships.create!(parent: parent, order: 0)
      expect(child.reload.ancestors).to include(parent)
    end
  end
end
