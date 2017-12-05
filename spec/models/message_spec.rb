require 'rails_helper'

RSpec.describe Message, type: :model do
  describe 'meta["tags"]' do
    it 'save #foo and #bar in content as meta.tags' do
      message = Message.create(content: 'content with #foo and #bar.')
      expect(message.reload.meta).to match(hash_including('tags' => ['foo', 'bar']))
    end

    describe 'tags ["foo", "bar"]' do
      before do
        Message.create!
        # Message.create!(meta: {'tags': []})
        Message.create!(meta: {'tags': ['foo', 'bar']})
      end

      describe 'scope tags(foo)' do
        it { expect(Message.tags('foo')).to exist }
      end

      describe 'scope tags(bazz)' do
        it { expect(Message.tags('bazz')).not_to exist }
      end

      describe 'scope no_tags(foo)' do
        it { expect(Message.no_tags('foo')).to exist }
      end

      describe 'scope tags()' do
        it { expect(Message.tags()).to exist }
      end
    end
  end
end
