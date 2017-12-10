require 'rails_helper'

RSpec.describe Message, type: :model do
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
  end
end
