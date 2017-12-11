require 'rails_helper'

RSpec.describe Message, type: :model do
  describe 'tags' do
    it do
      message = Message.create!(content: '#日本語 #todo #hoge #fuga')
      expect(message.meta['tags']).to match(array_including('日本語', 'todo'))
    end
  end

  describe 'scope :query' do
    describe 'query("todo")' do
      let(:subject) { Message.query('todo') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create! }
        it { is_expected.not_to exist }
      end
    end

    describe 'query("!todo")' do
      let(:subject) { Message.query('!todo') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(content: '#todo') }
        it { is_expected.not_to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create! }
        it { is_expected.to exist }
      end
    end

    describe 'query("todo !done")' do
      let(:subject) { Message.query('todo !done') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: %w[todo done]' do
        let!(:message) { Message.create!(content: '#todo #done') }
        it { is_expected.not_to exist }
      end

      context 'tags: nil' do
        let!(:message) { Message.create! }
        it { is_expected.not_to exist }
      end
    end

    describe 'query("todo !done !hidden")' do
      let(:subject) { Message.query('todo !done !hidden') }

      context 'tags: %w[todo]' do
        let!(:message) { Message.create!(content: '#todo') }
        it { is_expected.to exist }
      end

      context 'tags: %w[todo done]' do
        let!(:message) { Message.create!(content: '#todo #done') }
        it { is_expected.not_to exist }
      end

      context 'tags: %w[todo hidden]' do
        let!(:message) { Message.create!(content: '#todo #hidden') }
        it { is_expected.not_to exist }
      end

      context 'tags: %w[todo hidden done]' do
        let!(:message) { Message.create!(content: '#todo #hidden #done') }
        it { is_expected.not_to exist }
      end
    end
  end
end
